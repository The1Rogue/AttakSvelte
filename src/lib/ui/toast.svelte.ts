
const timeout = 5000

export let toasts: Array<[string, boolean]> = $state([])

export function addToast(msg: string, isError: boolean) {
    toasts.push([msg, isError])
    setTimeout(() => toasts.shift(), timeout)
}


