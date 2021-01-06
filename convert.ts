import * as cheerio from 'cheerio';
import * as fs from 'fs';
import { camelCase } from 'lodash';
import * as path from 'path';

const DRY_RUN = false

const extractReactComponents = require("html-to-react-components");

const componentNames = {}

const convertFiles = (dir: string, targetDir: string) => {
  const files = fs.readdirSync(dir)
  files.forEach((file: string) => {
    const filepath = path.resolve(dir, file)
    console.log(`Evaluating ${filepath}...\n`)
    const isDirectory = fs.lstatSync(filepath).isDirectory()
    if (isDirectory) {
      convertFiles(filepath, `${targetDir}/${file}`)
      return
    }
    const getComponentName = (file: string) => camelCase(path.basename(file).split('.')[0]).split('').map((l, n) => n === 0 ? l.toUpperCase() : l).join('')
    const componentName = getComponentName(file)
    if (componentNames[targetDir + '/' + componentName]) throw new Error('redundant component name')
    componentNames[targetDir + '/' + componentName] = true

    const destPath = path.resolve(__dirname, `src/views/${targetDir}`)
    if (!DRY_RUN)
      fs.mkdirSync(destPath, { recursive: true })

    const tagsToReplace = []
    let content = fs.readFileSync(filepath).toString()
    const $ = cheerio.load(content, { lowerCaseTags: false, lowerCaseAttributeNames: false, xml: true })
    const moduleTags = $('[module]')
    let extraImports = []
    moduleTags.toArray().forEach(tag => {
      const module = tag.attribs['module']
      const moduleTagAbsolutePath = path.resolve(__dirname, 'public', module)
      const destinationAbsolutePath = path.resolve(destPath, path.basename(module))
      const relativePath = path.dirname(path.relative(destPath, path.resolve(__dirname, 'src/views', module)))
      if (/^modules/.test(module)) {
        const importedComponentName = getComponentName(module)
        extraImports.push(`import ${importedComponentName} from '${relativePath}/${importedComponentName}';`)
        const importedComponentTag = `<${importedComponentName} />`
        tagsToReplace.push(importedComponentTag)
        const component = $(importedComponentTag)
        $(tag).append(component)
      } else if (/^images/.test(module)) {
        const imageName = path.basename(module)
        const imageVarName = camelCase(imageName.split('.')[0])
        if (!DRY_RUN)
          fs.copyFileSync(moduleTagAbsolutePath, destinationAbsolutePath)
        extraImports.push(`import ${imageVarName} from './${imageName}';`)
        $(tag).append(`<img src={${imageVarName}} />`)
      }
      delete tag.attribs['module']
    })
    const multipleRoots = $.root().children(':not(style, script)').length > 1
    content = $.root().html()

    if (multipleRoots) {
      content = `<faketag data-component="${componentName}">${content}</faketag>`
    } else {
      $.root().children().first().attr({ 'data-component': componentName })
      content = $.root().html()
    }
    let componentContent = extractReactComponents(content)[componentName] as string
    if (multipleRoots)
      componentContent = componentContent.replace(/faketag/g, '')

    componentContent = extraImports.join('\n') + '\n' + componentContent
    // handle style tags
    const styleTags = $('style').toArray().map(tag => $(tag).html()).filter(e => !/^\s*$/.test(e))
    if (styleTags.length > 0) {
      const styleContent = styleTags.join('\n')
      componentContent = `import '${componentName}.css'\n\n${componentContent}`
      const stylePath = path.resolve(destPath, `${componentName}.css`)
      console.log(`/// ${stylePath}`)
      console.log(styleContent)
      if (!DRY_RUN) fs.writeFileSync(stylePath, styleContent)
    }

    // handle script tags
    const scriptTags = $('script').toArray().map(tag => $(tag).html()).filter(e => !/^\s*$/.test(e))
    if (scriptTags.length > 0) {
      const scriptContent = scriptTags.join('\n')
      componentContent = componentContent.replace('render() {', `componentDidMount() {\n    ${scriptContent}\n  }\n\n  render() {`)
    }

    const componentPath = path.resolve(destPath, `${componentName}.jsx`)
    componentContent = componentContent.replace(/img src="{(.+)}"/g, "img src={$1}")
    tagsToReplace.forEach(tagString => {
      componentContent = componentContent.replace(new RegExp(tagString, 'gi'), tagString)
    })
    console.log(`/// ${componentPath}`)
    console.log(componentContent)
    if (!DRY_RUN) fs.writeFileSync(componentPath, componentContent)
  })
}

['tabs', 'templates', 'modules'].forEach(targetDir => {
  convertFiles(path.resolve(__dirname, `public/${targetDir}`), targetDir)
})
fs.rmdirSync(path.resolve(__dirname, 'components'), { recursive: true })
