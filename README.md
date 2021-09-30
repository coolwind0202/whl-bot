# discord_bot

White-Lucida 専用で稼働させる Bot のリポジトリです。

このリポジトリを clone すれば、 Docker コンテナで稼働することができます。

このプロジェクトの開発にあたって、Docker、 Docker-compose をインストールしてください。


## 稼働方法

本番環境へのデプロイを素早く行うために、
本番環境稼働ではGithub Packages を使い `docker pull` コマンドで即時に展開できるようにしています。

開発環境の場合、この Git リポジトリを clone して、`docker-compose up` コマンドで起動できます。
ただし、 Git リポジトリに bot のトークンは含まれていないので、別途トークンを設定する必要があります。


### 本番環境稼働の場合

```
docker pull ghcr.io/white-lucida/discord_bot:latest
```

### 開発環境の場合

1. Git リポジトリを clone します。
2. トークンを設定します（後述）。
3. `$ docker-compose up`

#### トークンについて

Bot を稼働するには、Discord Bot のトークンを設定する必要があります。
トークンを取得する権限のない方は、ビルドすることができません。

GitHub Packages に登録されている Docker イメージは、トークンのデータが既に含まれているので、トークンを知らなくても稼働できます。

以下は、開発用に、本番環境のbotとは異なるトークンを利用する場合の方法です。

#### .env ファイルを記述する（おすすめ）
このリポジトリの、 README.md と同じ階層に `.env` ファイルを作成します。内容は以下の通りです。

```
TOKEN = Discord bot のトークン
```

#### 環境変数を設定する

お使いのマシンの `TOKEN` 環境変数に、Discord bot のトークンを登録します。方法は省略します。

#### discord_token.txt ファイルを記述する（ビルド用）

`discord_token.txt` という名前のファイルを README.md と同じ階層に作成します。内容は以下の通りです。

```
Discord bot のトークン
```

ビルド・本番環境での稼働を行うにあたって、トークンが Git リポジトリにも本番環境の環境変数にも現れないように構成したいと考えました。
そこで、docker-compose の secrets 機能を使い、 `discord_token.txt` ファイルの内容は `/run/secret/discord_token` ファイルから読み出されるように構成しました。

[src/index.js](https://github.com/white-lucida/discord_bot/blob/main/src/index.ts) において、 `/run/secret/discord_token` ファイルの内容を Discord bot のトークンとして利用するようにハードコーディングされています。

この方法は、環境変数を使う他の方法と比べて特別です。 `discord_token.txt` を記述するのは、ビルド時だけにしてください。 `discord_token.txt` に変更を加えるのは、本番環境用の bot のトークンが変わったときだけにしてください。

### 仕様について

詳細な仕様と実装の方針は、 [whl-docs - Discordボット](https://github.com/white-lucida/whl-docs/tree/main/Discord%E3%83%9C%E3%83%83%E3%83%88) を参照してください。