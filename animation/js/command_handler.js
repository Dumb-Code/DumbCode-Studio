export class CommandRoot {

    constructor() {
        this.commands = []
    }

    command(...names) {
        let cmd = new Command(names)
        this.commands.push(cmd)
        return cmd
    }

    runCommand(str) {
        console.log(str)
        let split = str.match(/(?:[^\s"]+|"[^"]*")+/g)
        if(split.length === 0) {
            throw new Error(`String is empty ?`)
        }
        let cmdName = split.shift()
        let found = this.commands.filter(c => c.names.includes(cmdName))
        if(found.length === 0) {
            throw new Error(`Command ${cmdName} is invalid.`)
        }
        if(found.length !== 1) {
            throw new Error(`Command ${cmdName} is ambigious: ${found.map(c => `[${c.names}]`)}. Please report this to dumbcode`)
        }
        found[0].parseAndRun(cmdName, split)
    }
}

class Command {
    constructor(names) {
        this.names = names
        this.arguments = []
        this.subCommandIndex = -1
        this.repeatingArgument = null
        this.callback = null
    }

    argument(name, handler, repeating = false) {
        let arg = new Argument(name, handler)
        if(repeating === true) {
            if(this.repeatingArgument !== null) {
                throw new Error(`Internal error for command '${this.names}', setting up argument '${name}': Repeating argument has already been set.`)
            }
            this.repeatingArgument = arg
        } else {
            this.arguments.push(arg)
        }
        return this
    }

    endSubCommands() {
        this.subCommandIndex = this.arguments.length
        return this
    }

    onRun(callback) {
        this.callback = callback
    }

    parseAndRun(name, split) {
        if(this.callback === null) {
            throw new Error(`Internal error, ${name} command callback not set`)
        }
        let argStorage = new Map()
        for(let i = 0; i < Math.min(split.length, this.arguments.length); i++) {
            let arg = this.arguments[i]
            let str = split.shift()
            argStorage.set(arg.name, arg.parse(name, i, str))
        }
        if(this.repeatingArgument !== null) {
            argStorage.set(this.repeatingArgument.name, split.map(v => this.repeatingArgument.parse(name, -1, v)))
        }

        this.callback({
            get: arg => {
                if(!argStorage.has(arg)) {
                    throw Error(`Argument ${arg} is required`)
                }
                return argStorage.get(arg)
            },

            getOrNull: arg => argStorage.get(arg)
        })
    
    }
}

class Argument {
    constructor(name, handler) {
        this.name = name
        this.handler = handler
    }

    parse(commandName, idx, str) {
        try {
            return this.handler.parser(str)
        } catch(error) {
            let err = new Error(`Error in parseing command ${commandName}: Unable to parse argument ${this.name}: ` + error.message)
            err.argIdx = idx
            throw err
        }
    }
}

class ArgumentHandler {
    constructor(parser, suggester = _e => []) {
        this.parser = parser
        this.suggester = suggester
    }
}

export function indexHandler(str) {
    return new ArgumentHandler(
        p => [...p].map(c => {
            let idx = str.indexOf(c)
            if(idx == -1) {
                throw new Error(`${c} does not exist in [${str}]`)
            }
            return idx
        }),
        p => {
            if(p.length === 0) {
                return [...str]
            }
            return []
        }
    )
}

export function enumHandler(...values) {
    return new ArgumentHandler(
        p => {
            let idx = values.indexOf(p)
            if(idx == -1) {
                throw new Error(`${p} does not exist in [${values}]`)
            }
            return idx
        },
        p => {
            return values.filter(v => v.startsWith(p))
        }
    )
}

export function numberHandler(integer = false) {
    return new ArgumentHandler(p => {
        if(integer === true && p.indexOf('.') !== -1) {
            throw new Error(`${p} is not a whole number`)
        }
        let num = +p
        if(isNaN(num)) {
            throw new Error(`${p} is not a valid number`)
        }
        return num
    })
}