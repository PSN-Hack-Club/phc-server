const validEmail = (email) => {
    return email.match(
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
}

const validPathwaysEmail = (email) => {
    if (!validEmail(email)) {
        return false
    }

    const separatorIndex = email.indexOf('@')

    // gets the end of the domain, eg: gmail.com, yahoo.in
    const domain = email.substr(separatorIndex + 1, email.length - separatorIndex)

    return domain === 'pathways.in'
}

const nameFromEmail = (email) => {
    const separatorIndex = email.indexOf('@')
    return email
        .substr(0, separatorIndex)
        .replace(/[0-9]/g, '')
        .split('.')
        .map((x) => `${x.charAt(0).toUpperCase()}${x.substr(1)}`)
        .join(' ')
}

module.exports = {
    nameFromEmail,
    validEmail,
    validPathwaysEmail
}
