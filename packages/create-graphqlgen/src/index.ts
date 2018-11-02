#!/usr/bin/env node

import * as path from 'path'
import * as fs from 'fs'
import * as meow from 'meow'
import * as inquirer from 'inquirer'

import { loadGraphQLGenStarter } from './loader'
import {
  defaultTemplate,
  Template,
  availableTemplates,
  templatesNames,
} from './templates'

const cli = meow(
  `
    create-graphqlgen [dir]

    > Scaffolds the initial files of your project.

    Options:
      -t, --template  Select a template (${templatesNames}) Default: \`yoga\`.
      --no-install    Skips dependency installation.
      --no-generate   Skips model generation.
      --force (-f)    Overwrites existing files.
`,
  {
    flags: {
      'no-install': {
        type: 'boolean',
        default: false,
      },
      'no-generate': {
        type: 'boolean',
        default: false,
      },
      template: {
        type: 'string',
        default: 'yoga',
        alias: 't',
      },
      force: {
        type: 'boolean',
        default: false,
        alias: 'f',
      },
    },
  },
)

main(cli)

// Main

async function main(cli: meow.Result) {
  let template: Template = defaultTemplate

  if (cli.flags['template']) {
    const selectedTemplate = availableTemplates.find(
      template => template.name === cli.flags['template'],
    )

    if (selectedTemplate) {
      template = selectedTemplate
    } else {
      console.log(`Unknown template. Available templates: ${templatesNames}`)
      return
    }
  }

  let [output] = cli.input

  interface PathResponse {
    path: string
  }

  if (!output) {
    const res = await inquirer.prompt<PathResponse>([
      {
        name: 'path',
        message: 'Where should we scaffold graphql server?',
        type: 'input',
      },
    ])

    output = res.path
  }

  if (fs.existsSync(output)) {
    const allowedFiles = ['.git', '.gitignore']
    const conflictingFiles = fs
      .readdirSync(output)
      .filter(f => !allowedFiles.includes(f))

    if (conflictingFiles.length > 0 && !cli.flags.force) {
      console.log(`Directory ${output} must be empty.`)
      return
    }
  } else {
    fs.mkdirSync(output)
  }

  loadGraphQLGenStarter(template, path.resolve(output), {
    installDependencies: !cli.flags['no-install'],
    generateModels: !cli.flags['no-generate'],
  })
}
