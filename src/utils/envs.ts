const normalize = (value: string | undefined) => {
    return value?.replace(/\\n/g, "\n");
}

export { normalize }