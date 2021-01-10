/**
 * Handles the root of commands.
 * 
 * This is so ugly. This code needs a spa day
 */
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

    /**
     * Runs a command as if it were typed by a user
     * @param {string} text the command
     */
    doCommand(text) {
        this.commandLine.startCommand(text)
    }

    /**
     * Runs the command
     * @param {string} str the command to run 
     * @param {*} ctx the command context 
     */
    runCommand(str, ctx = {}) {
        //Split the command
        let split = splitStr(str)

        let commands = []
        let computedFlags = []

        //Get all the flags, otherwise get the commands
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
        //Not a dummy, and is actual.
        if(ctx.dummy !== true) {
            this.commandLine.outputLines.push(str)
            this.commandLine.onLinesChanged()
        }

        //Apply the hasFlag eleent
        ctx.hasFlag = (...flags) => flags.find(flag => computedFlags.indexOf(flag) !== -1) !== undefined

        return this.runCommandSplit(commands, ctx)
    }

    /**
     * Runs the command from split entries (with flags removed)
     * @param {string} split the split command 
     * @param {*} ctx the command context
     */
    runCommandSplit(split, ctx = {}) {
        //Apply the default command context stuff
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

        //Get the command name
        let cmdName = split.shift()
        let found = this.commands.filter(c => c.name === cmdName)
        //Ensure that only one command is found
        if(found.length === 0) {
            return {code:0, msg: `Command ${cmdName} is invalid.`}
        }
        if(found.length !== 1) {
            return {code:1, msg: `Command ${cmdName} is ambigious: ${found.map(c => c.name)}. Please report this to dumbcode`}
        }
        //Try and parse and run the command. 
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

/**
 * The command line. Weirdly tied with the command handler. Should merge?
 */
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
            //Enter key
            if(e.which == 13) {
                let val = input.val()
                if(val !== "") {
                    input.val('')
                    //If there isn't a command currently being built, start a new command
                    if(this.currentCommandBuilder === null) {
                        this.startCommand(val)
                    } else {
                        this.readNextLine(val)
                    }
                }
            }
        });
        input.on('input', () => {
            //If there is a currentl command builder
            if(this.currentCommandBuilder !== null && this.currentResolver !== null) {
                let val = input.val()
                try {
                    //Parse and resolve the value
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

    /**
     * Update the lines dom
     */
    onLinesChanged() {
        this.outputLinesDom.html(this.outputLines.join('<br>') + (this.editingLine === null ? '' : ('<br>' + this.editingLine)))
    }

    /**
     * Runs the next line for the command builder. 
     * Gets the next argument and awaits the value from the cmd line
     * If there is no next argument, constructs the command and executes it.
     */
    async activateNextLine() {
        if(this.currentCommandBuilder !== null) {
            this.editingLine = this.constructedCommand 
            let arg = this.currentCommandBuilder.command.arguments[this.currentCommandBuilder.index + this.parsedBuilderArguments]
            //If is no arguement, execute the constructed command. Otherwise get a new argument
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

    /**
     * Updates an argument. Used when an argument is updated (but not finished)
     * @param {*} constructed the constructed argument
     */
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

    /**
     * Read the next line
     * @param {string} val the line to read
     */
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

    /**
     * Starts a command builder
     * @param {string} val the command
     */
    startCommand(val) {
        this.previousCommand = val
        this.constructedCommand = ""
        this.currentResolver = null
        let cmds = []
        //Find the builder for that command
        this.root.commands.map(cmd => cmd.builders).forEach(builders => builders.filter(b => b.name == val).forEach(b => cmds.push(b)))
        
        //Ensure there is only 1 command found, and start it.
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

    /**
     * Runs the previous command
     */
    runPreviousCommand() {
        if(this.previousCommand !== null) {
            this.startCommand(this.previousCommand)
        }
    }

    /**
     * Promise that returns the next user input
     * @param {string} text text to display
     * @param {function} parser parser used to parse the values
     * @param {function} onkey when a key is pressed
     */
    async nextInput(text, parser, onkey) {
        this.editingLine = `${text}:`
        this.onLinesChanged()
        return new Promise(resolver => {
            this.currentResolver = { resolver, parser, onkey, text }
        })
    }
}

/**
 * Command used to store the builders, arguments, ect.
 */
class Command {
    constructor(name) {
        this.name = name
        this.builders = []
        this.arguments = []
        this.subCommandIndex = -1
        this.repeatingArgument = null //Repeating arguments are like varargs. 
        this.callback = null
        this.exitCallback = null
    }

    /**
     * Creates a new command builder
     * @param {string} name the command name
     * @param  {...any} previousArgs the previous arguments. Used to set the previous command arguments when a builder starts
     */
    addCommandBuilder(name, ...previousArgs) {
        this.builders.push(new CommandBuilder(this, name, previousArgs, this.arguments.length))
        return this
    }

    /**
     * Adds a new argument
     * @param {*} name the name of the argument
     * @param {*} handler the argument handler
     * @param {*} repeating whether the argument is repeating or not
     */
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

    /**
     * ?
     * Honestly no idea what this does. I think it's redundent. @todo remove?
     */
    endSubCommands() {
        this.subCommandIndex = this.arguments.length
        return this
    }

    /**
     * Sets the callback for when this is ran
     * @param {*} callback the callback
     */
    onRun(callback) {
        this.callback = callback
        return this
    }

    /**
     * Sets the callback for when this is exited.
     * @param {function} exitCallback the callback
     */
    onExit(exitCallback) {
        this.exitCallback = exitCallback
        return this
    }

    /**
     * parses and runs the command.
     * @param {string} name the command name
     * @param {string[]} split the split command data
     * @param {*} ctx the command context
     */
    parseAndRun(name, split, ctx) {
        if(this.callback === null) {
            throw new Error(`Internal error, ${name} command callback not set`)
        }
        //Create the argument storage
        let argStorage = new Map()
        //For every argument, parse the argument.
        for(let i = 0; i < this.arguments.length; i++) {
            let arg = this.arguments[i]
            argStorage.set(arg.name, arg.parse(name, i, split))
            if(split.length === 0) {
                break
            }
        }
        //If theres a repeating argument, use it.
        if(this.repeatingArgument !== null) {
            argStorage.set(this.repeatingArgument.name, split.map(v => this.repeatingArgument.parse(name, -1, v)))
        }

        //Run the callback
        this.callback(createCallbackCtx(argStorage, ctx))
    
    }
}

/**
 * Creates the callback context. Adds methods to get the argument
 * @param {Map} argStorage the argument storage map
 * @param {*} ctx the command context
 */
function createCallbackCtx(argStorage, ctx) {
    return {
        get: arg => {
            if(!argStorage.has(arg)) {
                throw Error(`Argument ${arg} is required`)
            }
            return argStorage.get(arg)
        },

        getOrNull: arg => argStorage.get(arg) || null,

        context: ctx
    }
}

/**
 * Command builder holds information about where a command starts, and the arguments before it.
 */
class CommandBuilder {
    constructor(command, name, previousArgs, index) {
        this.command = command
        this.name = name
        this.previousArgs = previousArgs
        this.index = index
    }
}

/**
 * Argument holds information about the name of an argument, and how it's handled.
 */
class Argument {
    constructor(name, handler) {
        this.name = name
        this.handler = handler
    }

    /**
     * Parses an argument from string list to whatever type.
     * Note that an argument can take up multiple entries in the string list.
     * @param {string} commandName the command name
     * @param {number} idx the index of the command
     * @param {split} split the remaining argument data
     */
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

/**
 * Argument handler. Used to store how the argument is parsed,
 * and how it's handled in command builders
 */
export class ArgumentHandler {
    constructor(parser, commandHandler) {
        this.parser = parser
        this.commandHandler = commandHandler
    }
}

/**
 * Parse n as a number.
 * @param {string} n the number to parse
 * @param {boolean} integer whether it's a whole number or not.  
 */
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

/**
 * Creates the axis nuber handler. Uses to allow the user to type numbers for each axis. 
 * The handler will return a list of entries with the axisId and the value
 * 
 * For example `axisNumberHandler(['a', 'b', 'c'])`
 * gives: `command <a> <b> <c>`, where <a/b/c> are numbers to be entered (required)
 * 
 * @param {string[]} axis the axis
 * @param {boolean} integer whether it's an ingeger or not
 */
export function axisNumberHandler(axis, integer = false) {
    return new ArgumentHandler(
        split => {
            //Parse the entries. Make sure each element is an axis.
            //Needs every value to have effect
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
        //The command builder
        async(cli) => {
            let constructedAxis = ""
            let numberArg = ""
            //Iterate over the axis length, and await the next number input
            for(let i = 0; i < axis.length; i++) {
                let a = axis.charAt(i)
                let num = await cli.nextInput(a, p => p===''?undefined:parseNum(p, integer), v => {
                    //Update the argument as it's typed. If nothing entered, then act like it doesn't exist
                    if(v === '') {
                        cli.updateArgument(constructedAxis + numberArg)
                    } else {
                        cli.updateArgument(constructedAxis + a + numberArg + " " + v)
                    }
                })
                //If the numner is valid, then update the argument
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

/**
 * Creates a number argument handler
 * `numberHandler()` gives `command <e>` where e is a number
 * @param {boolean} integer whether the number should be as a boolean or not
 */
export function numberHandler(integer = false) {
    return new ArgumentHandler(
        split => parseNum(split.shift(), integer),
        async(cli) => await cli.nextInput("Value", p => parseNum(p), v => cli.updateArgument(v))
    )
}

/**
 * Creates a boolean argument handler
 */
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

/**
 * Argument handler for getting the index of the character entered in a string.
 * For example, if we take`indexHandler('abc')`:
 * `command a` would return 0
 * `command b` would return 1
 * `command c` would return 2
 * `command d` would throw an error
 * @param {string} str a string of all the characters
 * @param {boolean} single if there is a single index, or multiple
 */
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

/**
 * Argument handler for getting the index of a entered text.
 * For example, if we take`enumHandler('hello', 'world')`:
 * `command hello` would return 0
 * `command world` would return 1
 * `command dumbcode` would throw an error
 * @param  {...any} values 
 */
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

/**
 * Argument handler for handling strings.
 */
export function stringHandler() {
    return new ArgumentHandler(split => split.shift())
}

/**
 * Helper function to split a string up, with quotation markes included.
 * For example: 'a b c "d e f"' would be ['a', 'b, 'c', 'd e f']
 * @todo: make sure that this doens't inlude the quotation marks
 * @param {string} str the input string
 */
function splitStr(str) {
    return str.match(/(?:[^\s"]+|"[^"]*")+/g)
}