declare namespace NodeJS {
    interface ProcessEnv {
        readonly NODE_ENV: 'development' | 'production' | 'test'
        readonly DISCORD_TOKEN: string
        readonly GUILD_ID: string
        readonly ENABLED_UPDATE_COMMAND?: string
        readonly FIREBASE_PROJECT_ID?: string
        readonly FIREBASE_CLIENT_EMAIL?: string
        readonly FIREBASE_PRIVATE_KEY?: string
        readonly BOT_OPT_OUT_ROLE_ID?: string
        readonly THREAD_PORTAL_CHANNEL_ID?: string
        readonly INTRODUCTION_CHANNEL_ID?: string
        readonly FRIEND_CODE_CHANNEL_ID?: string
    }
}