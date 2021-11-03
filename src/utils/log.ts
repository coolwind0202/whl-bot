import axios from "axios";

const log = (content: string) => {
    if (!process.env.LOG_WEBHOOK) return;
    axios.post(process.env.LOG_WEBHOOK, {
        "content": `＜ログ＞\n${content}`
    })
}

export { log }