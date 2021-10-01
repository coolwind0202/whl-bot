# discord_bot

White-Lucida 専用で稼働させる Bot のリポジトリです。

このリポジトリを clone すれば、 Docker コンテナで稼働することができます。

このプロジェクトの開発にあたって、Docker をインストールしてください。


## 稼働方法

### 本番環境稼働の場合

本番環境用の bot で稼働する場合、このコマンドを実行します
（ただしこのコマンドは、普段は使用しません。）

```
docker pull ghcr.io/white-lucida/discord_bot:latest
```

### 開発環境の場合

**要約**）
開発環境で稼働する場合、 bot や Discord サーバーをテスト用のものに差し替える必要があります。
環境変数の `DISCORD_TOKEN` に bot のトークン、 `GUILD_ID` に Discord サーバーのID を設定してください。

1. Git リポジトリを clone します。
2. トークン・サーバーIDを設定します（後述）。
3. `$ docker run`

### トークンの設定方法

#### .env ファイルを記述する（おすすめ）
このリポジトリの、 README.md と同じ階層に `.env` ファイルを作成します。内容は以下の通りです。

```
TOKEN = Discord bot のトークン
```

#### 環境変数を設定する

お使いのマシンの `TOKEN` 環境変数に、Discord bot のトークンを登録します。方法は省略します。

### 仕様について

詳細な仕様と実装の方針は、 [whl-docs - Discordボット](https://github.com/white-lucida/whl-docs/tree/main/Discord%E3%83%9C%E3%83%83%E3%83%88) を参照してください。