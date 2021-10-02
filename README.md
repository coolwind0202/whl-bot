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

開発環境で稼働する場合、 bot や Discord サーバーをテスト用のものに差し替える必要があります。

このプロジェクトではデータの差し替えを簡単に行えるように、環境変数を利用しています。
dotenv というnpmパッケージが利用されているので、 `.env` というファイルを README.md と同じ階層に置くことで、実行時だけ利用できる環境変数が設定できます。

1. Git リポジトリを clone します。
2. 環境変数を設定します（後述）。
3. `$ docker run`

### トークンの設定方法

#### .env ファイルを記述する（おすすめ）
このリポジトリの、 README.md と同じ階層に `.env` ファイルを作成します。雛形は以下の通りです。

```
DISCORD_TOKEN = ""
GUILD_ID = ""
ENABLED_UPDATE_COMMAND = ""
FIRESTORE_EMULATOR_HOST = ""
FIREBASE_PROJECT_ID = ""
FIREBASE_CLIENT_EMAIL = ""
FIREBASE_PRIVATE_KEY = ""
BOT_OPT_OUT_ROLE_ID = ""
```

`.env` ファイルの書式についてはここでは説明しません。

各環境変数の意味や期待する値について説明します。


##### DISCORD_TOKEN
**必須です。**

Discord bot のトークンです。ここを差し替えることであなたが管理する bot でソースコードを実行し、動作確認できます。
Discord bot のトークンの取得方法は、 https://qiita.com/1ntegrale9/items/cb285053f2fa5d0cccdf などを参照してください。

##### GUILD_ID
**必須です。**

White-Lucida の bot は、 White-Lucida の中だけで動作することが期待されています。
しかし、White-Lucida 以外の環境で動作させたい場合もあると思います。
そのような場合に、任意の Discord サーバーのIDをこの環境変数に設定すれば、そのサーバーを対象に bot が稼働します。

##### ENABLED_UPDATE_COMMAND
必須ではありません。

この bot には、bot の起動時にスラッシュコマンドのリストを自動設定する機能があります。
でも毎回スラッシュコマンドのリストを更新していると、 Discord API のレートリミットに引っかかるので、この環境変数の値が `true` のときだけコマンドリストを更新するように実装されています。

##### FIRESTORE_EMULATOR_HOST
必須ではありません。

Firebase Emulator を使用する場合だけ、この環境変数を設定します。
基本的に `localhost:8080` と記載していれば問題ないと思います。

##### FIREBASE_PROJECT_ID
必須ではありません。

あなたが使用する Firebase のプロジェクトIDを設定してください。
プロジェクトID は Firebase のコンソールのプロジェクト設定画面や、秘密鍵ファイルから参照できます。
省略した場合は、 Firestore の同期機能は実行されません。

##### FIREBASE_CLIENT_EMAIL
必須ではありません。

あなたが使用する Firebase の client email を設定してください。秘密鍵ファイルから参照できます。
省略した場合は、 Firestore の同期機能は実行されません。

##### FIREBASE_PRIVATE_KEY
必須ではありません。

あなたが使用する Firestore の private key を設定してください。秘密鍵ファイルから参照できます。
省略した場合は、 Firestore の同期機能は実行されません。

##### BOT_OPT_OUT_ROLE_ID
必須ではありません。

この環境変数は、 Bot の機能を使用しない選択をしたメンバーに付与されるロールのIDです。
この環境変数の値とロールのIDが一致するようなロールを持ったメンバーは、Firestore の同期機能の対象から外れます。

#### 環境変数を設定する

お使いのマシンの `TOKEN` 環境変数に、Discord bot のトークンを登録します。方法は省略します。

### 仕様について

詳細な仕様と実装の方針は、 [whl-docs - Discordボット](https://github.com/white-lucida/whl-docs/tree/main/Discord%E3%83%9C%E3%83%83%E3%83%88) を参照してください。