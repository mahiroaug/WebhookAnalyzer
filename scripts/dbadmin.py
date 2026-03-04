#!/usr/bin/env python3
"""
US-136〜US-140: DB 運用・メンテナンス CLI

全サブコマンドを単一エントリポイントに集約。
既存の SQLAlchemy モデルと非同期セッションを再利用。
標準ライブラリ argparse のみ使用（追加依存なし）。
Write 系操作には確認プロンプト + --yes スキップオプションを設ける。
"""
import argparse
import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path

# プロジェクトルートをパスに追加
_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import async_session, engine
from app.models.webhook import Webhook, WebhookAnalysis


# --- 非同期 DB 実行ヘルパー ---


async def run_async(coro):
    """非同期コルーチンを同期的に実行"""
    return await coro


def async_main(fn):
    """非同期 main を asyncio.run で実行"""
    def wrapper(*args, **kwargs):
        return asyncio.run(fn(*args, **kwargs))
    return wrapper


# --- stats (US-136) ---


async def cmd_stats() -> int:
    """テーブルごとのレコード数・ディスク使用量・source/event_type 別件数・最古/最新・未分析件数を表示"""
    try:
        async with engine.connect() as conn:
            # テーブル一覧とレコード数
            tables = ["webhooks", "webhook_analyses", "investigation_sessions", "webhook_sessions"]
            print("=== テーブル統計 ===")
            for tbl in tables:
                r = await conn.execute(text(f"SELECT count(*) FROM {tbl}"))
                cnt = r.scalar()
                r2 = await conn.execute(text(
                    f"SELECT pg_total_relation_size('{tbl}'::regclass)"
                ))
                size_b = r2.scalar() or 0
                size_kb = size_b / 1024
                print(f"  {tbl}: {cnt} 件, {size_kb:.1f} KB")

            # source 別件数
            print("\n=== source 別件数 ===")
            r = await conn.execute(
                text("SELECT source, count(*) FROM webhooks GROUP BY source ORDER BY count(*) DESC")
            )
            for row in r:
                print(f"  {row[0]}: {row[1]} 件")

            # event_type 別件数
            print("\n=== event_type 別件数 (上位10) ===")
            r = await conn.execute(
                text("SELECT event_type, count(*) FROM webhooks GROUP BY event_type ORDER BY count(*) DESC LIMIT 10")
            )
            for row in r:
                print(f"  {row[0]}: {row[1]} 件")

            # 最古/最新レコード
            print("\n=== レコード日時 ===")
            r = await conn.execute(text(
                "SELECT min(received_at), max(received_at) FROM webhooks"
            ))
            row = r.one()
            print(f"  最古: {row[0]}")
            print(f"  最新: {row[1]}")

            # 未分析 Webhook 件数
            r = await conn.execute(text("""
                SELECT count(*) FROM webhooks w
                WHERE NOT EXISTS (SELECT 1 FROM webhook_analyses a WHERE a.webhook_id = w.id)
            """))
            unanalyzed = r.scalar()
            print(f"\n未分析 Webhook: {unanalyzed} 件")
        return 0
    except Exception as e:
        print(f"接続エラー: {e}", file=sys.stderr)
        return 1


# --- list (US-137) ---


async def cmd_list(source: str | None, limit: int, fmt: str) -> int:
    """Webhook レコードを一覧表示"""
    async with async_session() as session:
        stmt = select(Webhook).order_by(Webhook.received_at.desc()).limit(limit)
        if source:
            stmt = stmt.where(Webhook.source == source)
        r = await session.execute(stmt)
        items = r.scalars().all()
        if not items:
            print("該当レコードなし")
            return 0
        if fmt == "json":
            data = [
                {
                    "id": str(w.id),
                    "sequence_index": w.sequence_index,
                    "source": w.source,
                    "event_type": w.event_type,
                    "received_at": w.received_at.isoformat() if w.received_at else None,
                }
                for w in items
            ]
            print(json.dumps(data, ensure_ascii=False, indent=2))
        else:
            print(f"{'ID':<40} {'#':>6} {'source':<16} {'event_type':<32} received_at")
            print("-" * 120)
            for w in items:
                idx = w.sequence_index or "-"
                rec = w.received_at.strftime("%Y-%m-%d %H:%M") if w.received_at else "-"
                print(f"{str(w.id):<40} {idx:>6} {w.source:<16} {w.event_type:<32} {rec}")
        return 0


# --- show (US-137) ---


async def cmd_show(webhook_id: str) -> int:
    """指定 ID の Webhook 詳細を表示"""
    from uuid import UUID
    try:
        wid = UUID(webhook_id)
    except ValueError:
        print(f"無効な ID: {webhook_id}", file=sys.stderr)
        return 1
    async with async_session() as session:
        stmt = select(Webhook).where(Webhook.id == wid)
        r = await session.execute(stmt)
        w = r.scalar_one_or_none()
        if not w:
            print("該当レコードなし")
            return 1
        print("=== メタ情報 ===")
        print(f"  id: {w.id}")
        print(f"  sequence_index: {w.sequence_index}")
        print(f"  source: {w.source}")
        print(f"  event_type: {w.event_type}")
        print(f"  group_key: {w.group_key}")
        print(f"  received_at: {w.received_at}")
        print(f"  http_method: {w.http_method}")
        print(f"  remote_ip: {w.remote_ip}")
        print("\n=== Payload ===")
        print(json.dumps(w.payload, ensure_ascii=False, indent=2))
        a_stmt = select(WebhookAnalysis).where(WebhookAnalysis.webhook_id == wid).order_by(WebhookAnalysis.analyzed_at.desc()).limit(1)
        ar = await session.execute(a_stmt)
        ana = ar.scalar_one_or_none()
        if ana:
            print("\n=== 分析結果 ===")
            print(f"  summary: {ana.summary[:200]}..." if ana.summary and len(ana.summary or "") > 200 else f"  summary: {ana.summary}")
            if ana.field_descriptions:
                print("  field_descriptions:", json.dumps(ana.field_descriptions, ensure_ascii=False, indent=4)[:500])
        return 0


# --- delete (US-138) ---


async def cmd_delete(source: str | None, before: str | None, yes: bool) -> int:
    """条件一致レコードを削除（CASCADE で analyses 等も削除）"""
    from sqlalchemy import delete
    async with async_session() as session:
        stmt = select(Webhook.id)
        if source:
            stmt = stmt.where(Webhook.source == source)
        if before:
            try:
                dt = datetime.fromisoformat(before.replace("Z", "+00:00"))
            except ValueError:
                print(f"無効な日付: {before}", file=sys.stderr)
                return 1
            stmt = stmt.where(Webhook.received_at < dt)
        r = await session.execute(select(func.count()).select_from(stmt.subquery()))
        cnt = r.scalar()
        if cnt == 0:
            print("削除対象 0 件")
            return 0
        if not yes:
            a = input(f"削除対象 {cnt} 件。実行しますか？ (y/N): ")
            if a.lower() != "y":
                print("キャンセルしました")
                return 0
        del_stmt = delete(Webhook)
        if source:
            del_stmt = del_stmt.where(Webhook.source == source)
        if before:
            dt = datetime.fromisoformat(before.replace("Z", "+00:00"))
            del_stmt = del_stmt.where(Webhook.received_at < dt)
        await session.execute(del_stmt)
        await session.commit()
        print(f"{cnt} 件削除しました")
        return 0


# --- purge (US-138) ---


def parse_older_than(s: str) -> int:
    """30 または 30d 形式を日数に変換"""
    s = s.strip().rstrip("dD")
    return int(s)


async def cmd_purge(older_than_days: int, yes: bool) -> int:
    """指定日数より古いレコードを削除"""
    from datetime import timedelta
    from sqlalchemy import delete
    async with async_session() as session:
        cutoff = datetime.now() - timedelta(days=older_than_days)
        cnt_stmt = select(func.count()).select_from(Webhook).where(Webhook.received_at < cutoff)
        r = await session.execute(cnt_stmt)
        cnt = r.scalar()
        if cnt == 0:
            print("削除対象 0 件")
            return 0
        if not yes:
            a = input(f"{cnt} 件削除します。実行しますか？ (y/N): ")
            if a.lower() != "y":
                print("キャンセルしました")
                return 0
        stmt = delete(Webhook).where(Webhook.received_at < cutoff)
        await session.execute(stmt)
        await session.commit()
        print(f"{cnt} 件削除しました")
        return 0


# --- reset (US-138) ---


async def cmd_reset(yes: bool) -> int:
    """全テーブルを TRUNCATE"""
    async with engine.begin() as conn:
        cnt_r = await conn.execute(text("SELECT count(*) FROM webhooks"))
        cnt = cnt_r.scalar()
        if cnt == 0:
            print("削除対象 0 件")
            return 0
        if not yes:
            a = input("全テーブルを TRUNCATE します。本当に実行しますか？ (y/N): ")
            if a.lower() != "y":
                print("キャンセルしました")
                return 0
            a2 = input("二重確認: もう一度 y を入力: ")
            if a2.lower() != "y":
                print("キャンセルしました")
                return 0
        for tbl in ["webhook_sessions", "webhook_analyses", "webhooks", "investigation_sessions"]:
            await conn.execute(text(f"TRUNCATE TABLE {tbl} CASCADE"))
        print("全テーブルを TRUNCATE しました")
        return 0


# --- analysis reset (US-139) ---


async def cmd_analysis_reset(source: str | None, all_flag: bool, yes: bool) -> int:
    """AI 分析結果のみを削除"""
    async with async_session() as session:
        if all_flag:
            stmt = select(WebhookAnalysis)
        elif source:
            stmt = select(WebhookAnalysis).join(Webhook).where(Webhook.source == source)
        else:
            print("--source または --all を指定してください", file=sys.stderr)
            return 1
        r = await session.execute(select(func.count()).select_from(stmt.subquery()))
        cnt = r.scalar()
        if cnt == 0:
            print("削除対象 0 件")
            return 0
        if not yes:
            a = input(f"分析結果 {cnt} 件を削除します。実行しますか？ (y/N): ")
            if a.lower() != "y":
                print("キャンセルしました")
                return 0
        if all_flag:
            await session.execute(WebhookAnalysis.__table__.delete())
        else:
            ids = await session.execute(select(WebhookAnalysis.id).join(Webhook).where(Webhook.source == source))
            for row in ids:
                a = await session.get(WebhookAnalysis, row[0])
                if a:
                    await session.delete(a)
        await session.commit()
        print(f"{cnt} 件の分析結果を削除しました")
        return 0


# --- analysis status (US-139) ---


async def cmd_analysis_status() -> int:
    """分析済み/未分析の件数を source 別に表示"""
    async with async_session() as session:
        r = await session.execute(text("""
            SELECT w.source,
                   count(*) FILTER (WHERE EXISTS (SELECT 1 FROM webhook_analyses a WHERE a.webhook_id = w.id)) AS analyzed,
                   count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM webhook_analyses a WHERE a.webhook_id = w.id)) AS unanalyzed,
                   count(*) AS total
            FROM webhooks w
            GROUP BY w.source
        """))
        print("source           | analyzed | unanalyzed | total")
        print("-" * 50)
        for row in r:
            print(f"{row[0]:<16} | {row[1]:>8} | {row[2]:>10} | {row[3]:>5}")
        return 0


# --- maintain vacuum (US-140) ---


async def cmd_maintain_vacuum() -> int:
    """VACUUM ANALYZE を全テーブルに実行（asyncpg で AUTOCOMMIT 接続）"""
    import asyncpg
    tables = ["webhooks", "webhook_analyses", "investigation_sessions", "webhook_sessions"]
    dsn = settings.database_url.replace("postgresql+asyncpg://", "postgresql://", 1)
    try:
        conn = await asyncpg.connect(dsn)
        try:
            for tbl in tables:
                await conn.execute(f"VACUUM ANALYZE {tbl}")
                print(f"VACUUM ANALYZE {tbl} 完了")
        finally:
            await conn.close()
        print("全テーブルの VACUUM 完了")
        return 0
    except Exception as e:
        print(f"VACUUM 失敗: {e}", file=sys.stderr)
        return 1


# --- maintain reindex (US-140) ---


async def cmd_maintain_reindex() -> int:
    """sequence_index を received_at 順に 1 から連番で再採番"""
    async with async_session() as session:
        r = await session.execute(
            select(Webhook.id).order_by(Webhook.received_at.asc())
        )
        ids = [row[0] for row in r]
        for i, wid in enumerate(ids, 1):
            await session.execute(
                Webhook.__table__.update().where(Webhook.id == wid).values(sequence_index=i)
            )
        await session.commit()
        print(f"sequence_index を {len(ids)} 件再採番しました")
        return 0


# --- メイン ---


def main() -> int:
    parser = argparse.ArgumentParser(description="DB 運用・メンテナンス CLI")
    sub = parser.add_subparsers(dest="cmd", required=True)

    # stats
    p_stats = sub.add_parser("stats", help="DB 統計・ヘルスチェック")
    p_stats.set_defaults(func=lambda _: asyncio.run(cmd_stats()))

    # list
    p_list = sub.add_parser("list", help="Webhook 一覧")
    p_list.add_argument("--source", help="source でフィルタ")
    p_list.add_argument("--limit", type=int, default=20, help="取得件数")
    p_list.add_argument("--format", choices=["text", "json"], default="text", dest="fmt")
    p_list.set_defaults(func=lambda a: asyncio.run(cmd_list(a.source, a.limit, a.fmt)))

    # show
    p_show = sub.add_parser("show", help="Webhook 詳細表示")
    p_show.add_argument("id", help="Webhook ID")
    p_show.set_defaults(func=lambda a: asyncio.run(cmd_show(a.id)))

    # delete
    p_del = sub.add_parser("delete", help="条件指定で削除")
    p_del.add_argument("--source", help="source でフィルタ")
    p_del.add_argument("--before", help="この日時より古いレコード (ISO8601)")
    p_del.add_argument("--yes", action="store_true", help="確認をスキップ")
    p_del.set_defaults(func=lambda a: asyncio.run(cmd_delete(a.source, a.before, a.yes)))

    # purge
    p_purge = sub.add_parser("purge", help="古いレコードを一括削除")
    p_purge.add_argument("--older-than", required=True, dest="older_than", metavar="N|Nd", help="例: 30 または 30d (日数)")
    p_purge.add_argument("--yes", action="store_true", help="確認をスキップ")
    p_purge.set_defaults(func=lambda a: asyncio.run(cmd_purge(parse_older_than(a.older_than), a.yes)))

    # reset
    p_reset = sub.add_parser("reset", help="全テーブル TRUNCATE (--all 必須)")
    p_reset.add_argument("--all", action="store_true", dest="all_flag", required=True)
    p_reset.add_argument("--yes", action="store_true", help="確認をスキップ")
    p_reset.set_defaults(func=lambda a: asyncio.run(cmd_reset(a.yes)))

    # analysis reset
    p_ar = sub.add_parser("analysis", help="分析結果関連")
    p_ar_sub = p_ar.add_subparsers(dest="subcmd", required=True)
    p_ar_reset = p_ar_sub.add_parser("reset", help="分析結果をリセット")
    p_ar_reset.add_argument("--source", help="source でフィルタ")
    p_ar_reset.add_argument("--all", action="store_true", dest="all_flag")
    p_ar_reset.add_argument("--yes", action="store_true", help="確認をスキップ")
    p_ar_reset.set_defaults(func=lambda a: asyncio.run(cmd_analysis_reset(a.source, a.all_flag, a.yes)))
    p_ar_status = p_ar_sub.add_parser("status", help="分析済み/未分析件数")
    p_ar_status.set_defaults(func=lambda a: asyncio.run(cmd_analysis_status()))

    # maintain
    p_maint = sub.add_parser("maintain", help="DB メンテナンス")
    p_maint_sub = p_maint.add_subparsers(dest="subcmd", required=True)
    p_maint_v = p_maint_sub.add_parser("vacuum", help="VACUUM ANALYZE")
    p_maint_v.set_defaults(func=lambda _: asyncio.run(cmd_maintain_vacuum()))
    p_maint_r = p_maint_sub.add_parser("reindex", help="sequence_index 再採番")
    p_maint_r.set_defaults(func=lambda _: asyncio.run(cmd_maintain_reindex()))

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
