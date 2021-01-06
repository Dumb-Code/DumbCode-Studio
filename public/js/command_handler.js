export class CommandRoot {

    constructor(dom, raytracer, pth) {
        this.commands = []
        this.raytracer = raytracer
        this.pth = pth
        this.commandLine = new CommandLine(dom, this)
    }

    command(name) {
        let cmd = new Command(name)
        this.commands.push(cmd)
        return cmd
    }

    doCommand(text) {
        this.commandLine.startCommand(text)
    }

    runCommand(str, ctx = {}) {
        let split = splitStr(str)

        let commands = []
        let computedFlags = []

        split.forEach(v => {
            if(v.startsWith('-')) {
                computedFlags.push(v.substring(1))
            } else {
                commands.push(v)
            }
        })

        if(commands.length === 0) {
            throw new Error(`String is empty ?`)
        }
        if(ctx.dummy !== true) {
            this.commandLine.outputLines.push(str)
            this.commandLine.onLinesChanged()
        }

        ctx.hasFlag = (...flags) => flags.find(flag => computedFlags.indexOf(flag) !== -1) !== undefined

        return this.runCommandSplit(commands, ctx)
    }

    runCommandSplit(split, ctx = {}) {
        ctx.getCube = () => {
            if(ctx.cube !== undefined) {
                return ctx.cube
            }
            if(this.raytracer.selectedSet.size === 0) {
                throw new Error("No cube selected")
            }
            if(this.raytracer.selectedSet.size !== 1) {
                throw new Error("More than one cube selected")
            }
            return this.raytracer.firstSelected().tabulaCube
        }
        ctx.getAllCubes = () => {
            if(this.raytracer.selectedSet.size === 0) {
                throw new Error("No cube selected")
            }
            return [...this.raytracer.selectedSet].map(c => c.tabulaCube)
        }
        ctx.selected = () => this.raytracer.selectedSet.size
        ctx.getTblModel = () => this.pth.model
        let cmdName = split.shift()
        let found = this.commands.filter(c => c.name === cmdName)
        if(found.length === 0) {
            return {code:0, msg: `Command ${cmdName} is invalid.`}
        }
        if(found.length !== 1) {
            return {code:1, msg: `Command ${cmdName} is ambigious: ${found.map(c => c.name)}. Please report this to dumbcode`}
        }
        try {
            found[0].parseAndRun(cmdName, split, ctx)
        } catch(err) {
            this.commandLine.editingLine = err.message
            this.commandLine.onLinesChanged() 
            console.error(err)
        }
        return {code:-1}
    }
}

class CommandLine {
    constructor(dom, root) {
        this.constructedCommand = ""
        this.root = root
        this.currentResolver = null
        this.currentCommandBuilder = null
        this.parsedBuilderArguments = 0
        this.previousCommand = null

        this.outputLinesDom = dom.find('.command-output-lines')
        this.outputLines = []
        this.editingLine = null


        let input = dom.find('.command-line-field')
        $(document).on('keypress', e => {
            if(e.which == 13) {
                let val = input.val()
                if(val !== "") {
                    input.val('')
                    if(this.currentCommandBuilder === null) {
                        this.startCommand(val)
                    } else {
                        this.readNextLine(val)
                    }
                }
            }
        });
        input.on('input', () => {
            if(this.currentCommandBuilder !== null && this.currentResolver !== null) {
                let val = input.val()
                try {
                    this.currentResolver.parser(val)
                    this.currentResolver.onkey(val)
                    this.editingLine = `${this.currentResolver.text}:`
                } catch(err) {
                    this.editingLine = err.message
                    this.currentResolver.onkey('')
                }
                this.onLinesChanged() 
            }
        })
    }

    onLinesChanged() {
        this.outputLinesDom.html(this.outputLines.join('<br>') + (this.editingLine === null ? '' : ('<br>' + this.editingLine)))
    }

    async activateNextLine() {
        if(this.currentCommandBuilder !== null) {
            this.editingLine = this.constructedCommand 
            let arg = this.currentCommandBuilder.command.arguments[this.currentCommandBuilder.index + this.parsedBuilderArguments]
            if(arg === undefined) {
                let exit = this.currentCommandBuilder.command.exitCallback
                if(exit !== null) {
                    exit()
                }
                this.currentCommandBuilder = null
                this.editingLine = null
                this.parsedBuilderArguments = 0
                this.root.runCommand(this.constructedCommand)
            } else {
                let value = await arg.handler.commandHandler(this)
                this.constructedCommand += ' ' + value
                this.parsedBuilderArguments++
                this.activateNextLine()
            }
            this.onLinesChanged()
        }
    }

    updateArgument(constructed) {
        let cmd = this.constructedCommand + " " + constructed
        this.editingLine = cmd
        this.onLinesChanged() 
        try {
            this.root.runCommand(cmd, { dummy:true })
        } catch(error) {
            let exit = this.currentCommandBuilder.command.exitCallback
            if(exit !== null) {
                exit()
            }
        }
    }

    readNextLine(val) {
        if(this.currentResolver !== null) {
            try {
                this.currentResolver.parser(val)//check it can be parsed
                this.currentResolver.resolver(val)
            } catch (error) {
                this.editingLine = error.message
                this.onLinesChanged() 
            }
        }
    }

    startCommand(val) {
        this.previousCommand = val
        this.constructedCommand = ""
        this.currentResolver = null
        let cmds = []
        this.root.commands.map(cmd => cmd.builders).forEach(builders => builders.filter(b => b.name == val).forEach(b => cmds.push(b)))
        if(cmds.length === 0) {
            let res = this.root.runCommand(val)
            if(res.code < 0) {
                return
            }
            this.editingLine = `Command ${val} not found`
        } else if(cmds.length !== 1) {
            this.editingLine = `Command ${val} is ambigous! Contact dumbcode.`
        } else {
            this.constructedCommand = cmds[0].command.name + ' ' + cmds[0].previousArgs.join(' ')
            this.currentCommandBuilder = cmds[0]
            setTimeout(() => this.activateNextLine())
        }
        this.onLinesChanged()
    }

    runPreviousCommand() {
        if(this.previousCommand !== null) {
            this.startCommand(this.previousCommand)
        }
    }

    async nextInput(text, parser, onkey) {
        this.editingLine = `${text}:`
        this.onLinesChanged()
        return new Promise(resolver => {
            this.currentResolver = { resolver, parser, onkey, text }
        })
    }
}

class Command {
    constructor(name) {
        this.name = name
        this.builders = []
        this.arguments = []
        this.subCommandIndex = -1
        this.repeatingArgument = null
        this.callback = null
        this.exitCallback = null
    }

    addCommandBuilder(name, ...previousArgs) {
        this.builders.push(new CommandBuilder(this, name, previousArgs, this.arguments.length))
        return this
    }

    argument(name, handler, repeating = false) {
        if(this.callback !== null) {
            throw new Error(`Internal error for command '${this.name}', setting up argument '${name}': Run callback has been set`)
        }
        let arg = new Argument(name, handler)
        if(repeating === true) {
            if(this.repeatingArgument !== null) {
                throw new Error(`Internal error for command '${this.name}', setting up argument '${name}': Repeating argument has already been set.`)
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
        return this
    }

    onExit(exitCallback) {
        this.exitCallback = exitCallback
        return this
    }

    parseAndRun(name, split, ctx) {
        if(this.callback === null) {
            throw new Error(`Internal error, ${name} command callback not set`)
        }
        let argStorage = new Map()
        for(let i = 0; i < this.arguments.length; i++) {
            let arg = this.arguments[i]
            argStorage.set(arg.name, arg.parse(name, i, split))
            if(split.length === 0) {
                break
            }
        }
        if(this.repeatingArgument !== null) {
            argStorage.set(this.repeatingArgument.name, split.map(v => this.repeatingArgument.parse(name, -1, v)))
        }
        this.callback(createCallbackCtx(argStorage, ctx))
    
    }
}

function createCallbackCtx(argStorage, ctx) {
    return {
        get: arg => {
            if(!argStorage.has(arg)) {
                throw Error(`Argument ${arg} is required`)
            }
            return argStorage.get(arg)
        },

        getOrNull: arg => argStorage.get(arg),

        context: ctx
    }
}

class CommandBuilder {
    constructor(command, name, previousArgs, index) {
        this.command = command
        this.name = name
        this.previousArgs = previousArgs
        this.index = index
    }
}

class Argument {
    constructor(name, handler) {
        this.name = name
        this.handler = handler
    }

    parse(commandName, idx, split) {
        try {
            return this.handler.parser(split)
        } catch(error) {
            let err = new Error(`Error in parseing command ${commandName}: Unable to parse argument ${this.name}: ` + error.message)
            err.argIdx = idx
            throw err
        }
    }
}

export class ArgumentHandler {
    constructor(parser, commandHandler) {
        this.parser = parser
        this.commandHandler = commandHandler
    }
}

function parseNum(n, integer = false) {
    if(integer === true && n.indexOf('.') !== -1) {
        throw new Error(`${n} is not a whole number`)
    }
    let num = +n
    if(isNaN(num)) {
        throw new Error(`${n} is not a valid number`)
    }
    return num;
}

export function axisNumberHandler(axis, integer = false) {
    return new ArgumentHandler(
        split => {
            let axisList = [...split.shift()].map(c => {
                let idx = axis.indexOf(c)
                if(idx == -1) {
                    throw new Error(`${c} does not exist in [${axis}]`)
                }
                return idx
            })

            if(axisList.length < split.length) {
                throw new Error(`${axis.length} axis provided, but only ${split.length} values provided.`)
            }
            return axisList.map(e => { return { axisID: e, value: parseNum(split.shift(), integer) } })
        },
        async(cli) => {
            let constructedAxis = ""
            let numberArg = ""
            for(let i = 0; i < axis.length; i++) {
                let a = axis.charAt(i)
                let num = await cli.nextInput(a, p => p===''?undefined:parseNum(p, integer), v => {
                    if(v === '') {
                        cli.updateArgument(constructedAxis + numberArg)
                    } else {
                        cli.updateArgument(constructedAxis + a + numberArg + " " + v)
                    }
                })
                if(num !== '') {
                    constructedAxis += a
                    numberArg += " " + num
                    cli.updateArgument(constructedAxis + numberArg)
                }
            }
            return constructedAxis + numberArg
        }
    )
}

export function numberHandler(integer = false) {
    return new ArgumentHandler(
        split => parseNum(split.shift(), integer),
        async(cli) => await cli.nextInput("Value", p => parseNum(p), v => cli.updateArgument(v))
    )
}

export function booleanHandler() {
    let parseBool = p => {
        if(p == 'true') {
            return true
        }
        if(p == 'false') {
            return false
        }
        throw new Error(`${p} is neither 'true' or 'false'`)
    }
    return new ArgumentHandler(
        split => parseBool(split.shift()),
        async(cli) => await cli.nextInput("Value", p => parseBool(p), v => cli.updateArgument(v))
    )
}

export function indexHandler(str, single = false) {
    let parseIndex = p => {
        let idx = str.indexOf(p)
        if(idx == -1) {
            throw new Error(`${p} does not exist in [${str}]`)
        }
        return idx
    }
    let parseIndexes = p => [...p.split('')].map(c => parseIndex(c)) 

    let func = single ? parseIndex : parseIndexes

    return new ArgumentHandler(
        split => func(split.shift()),
        async(cli) => await cli.nextInput(`Value [${str}]`, p => func(p), v => cli.updateArgument(v))
    )
    
}

export function enumHandler(...values) {
    let indexParser = p => {
        let idx = values.indexOf(p)
        if(idx == -1) {
            throw new Error(`${p} does not exist in [${values}]`)
        }
        return idx
    }
    let str = ""
    values.forEach((v, idx) => str += (idx==values.length?"or " + v : v + ", "))
    return new ArgumentHandler(
        split => indexParser(split.shift()),
        async(cli) => await cli.nextInput(str, p => indexParser(p), v => cli.updateArgument(v))
    )
}

export function stringHandler() {
    return new ArgumentHandler(split => split.shift())
}

function splitStr(str) {
    return str.match(/(?:[^\s"]+|"[^"]*")+/g)
}