import { ArgumentHandler } from './Argument';
export class Command<
  M extends {
    [P: string]: ArgumentHandler<any>
  },
  T extends {
    [P in keyof M]: M[P] extends ArgumentHandler<infer V> ? V : never
  },
  B extends keyof M
  > {

  private readonly builders: { name: string, previousArguments: Omit<T, B> }[] = []

  constructor(
    private readonly name: string,       //The name of this command
    private readonly argumentMap: M,     //The map of argument name -> argument handler
    private readonly builderArgument?: B //The argument that the builder runs on
  ) {
  }

  addCommandBuilder(name: string, previousArguments: Omit<T, B>): this {
    this.builders.push({ name, previousArguments })
    return this
  }
}

