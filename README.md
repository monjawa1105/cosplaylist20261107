# コスプレ併せ・参加者早見表

スマホ向けの静的サイトです。HTML / CSS / JavaScript / JSON だけで動き、GitHub Pages に公開できます。

## ファイル構成

```text
cosplay-meetup-site/
├── index.html
├── style.css
├── script.js
└── data/
    ├── event.json
    └── participants.json
```

## 最初に編集するファイル

### 1. `data/event.json`
- `createdBy`: 制作者名
- `creatorXIds`: 上部に表示するX ID。`@` は付けても付けなくてもOK
- `date`: 開催日。`YYYY-MM-DD` 形式
- `eventName`: 併せ名

### 2. `data/participants.json`
参加者ごとに1つのオブジェクトを追加します。

- `xId`: X ID（プロフィールリンクとアイコン取得に使用）
- `name`: 表示名
- `reading`: 読み方
- `role`: `cosplay` / `camera` / `assistant` のいずれか
- `character`: コスプレ参加者のキャラクター名。その他の役割は空文字でOK
- `sortOrder`: 同じ役割の中での表示順。小さい数字ほど上

X IDがない場合は `""` にしてください。アイコンが取得できない場合は名前の1文字を表示します。

## ローカルでの確認

`index.html` をファイルから直接開くのではなく、VS Code の Live Server 拡張機能などでローカルサーバーを起動してください。JSONを `fetch()` で読み込むためです。

## GitHub Pages への公開

1. このフォルダの中身をGitHubリポジトリに置く
2. GitHubのリポジトリ設定 → Pages で公開元を設定
3. `main` ブランチのルートを公開する場合は `/ (root)` を選ぶ
4. 変更後は `git add .` → `git commit -m "参加者一覧を更新"` → `git push`

## 別の併せに再利用する

`data/event.json` と `data/participants.json` を新しい併せの内容に置き換えるだけで、基本的には同じサイトを使い回せます。

## 注意

- Xアイコンは `unavatar.io` を利用しています。外部サービスの仕様やX側の制限によって取得できないことがあり、その場合はイニシャル表示になります。
- このサイトはJSONファイルをブラウザに配信するため、掲載情報は公開情報として扱ってください。参加者の同意を得てからX IDなどを掲載してください。
- ローカルファイルをダブルクリックで開いた場合、ブラウザがJSON読み込みを制限することがあります。Live Serverなどを使用してください。
