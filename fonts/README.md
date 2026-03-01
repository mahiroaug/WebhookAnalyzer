# PDF 用フォント（任意）

PDF レポートで **Meiryo（メイリオ）** を使うには、次のいずれかで `meiryo.ttc` を用意してください。

- **Windows**: `C:\Windows\Fonts\meiryo.ttc` が自動で使われます。
- **WSL など**: Windows のフォントが `/mnt/c/Windows/Fonts/meiryo.ttc` で見える場合、自動で使われます。
- **任意のパス**: 環境変数 `PDF_MEIRYO_FONT_PATH` に `meiryo.ttc` の絶対パスを指定してください。
- **このフォルダ**: ここに `meiryo.ttc` を置くとプロジェクトから参照されます（ライセンスに注意）。

Meiryo が見つからない場合は、PDF は HeiseiMin-W3（Adobe Asian Language Pack 相当）にフォールバックします。
