const ROLE_OPTIONS = [
    {value: 1, name: 'R. Single Attacker'},
    {value: 2, name: 'R. Multi Attacker'},
    {value: 3, name: 'Sp. Single Attacker'},
    {value: 4, name: 'Sp. Multi Attacker'},
    {value: 5, name: 'Buffer'},
    {value: 6, name: 'Debuffer'},
    {value: 7, name: 'Healer'},
]

const LANGAUGES = [
    {value: 'en', name: 'EN'},
    {value: 'cn', name: 'CN'},
    {value: 'tw', name: 'TW'},
    {value: 'kr', name: 'KR'},
    {value: 'jp', name: 'JP'},
]

const MAX_EMBED_FIELDS = 25
const MAX_EMBED_SIZE = 6000

const ROLE_MAP = new Map(ROLE_OPTIONS.map(({value, name}) => {
    return [value, name]
}))

module.exports = {
    ROLE_OPTIONS: ROLE_OPTIONS,
    LANGAUGES: LANGAUGES,
    MAX_EMBED_FIELDS: MAX_EMBED_FIELDS,
    MAX_EMBED_SIZE: MAX_EMBED_SIZE,
    ROLE_MAP: ROLE_MAP
}