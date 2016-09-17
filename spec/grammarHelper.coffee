path = require 'path'

exports.makeSureGrammarExists = () ->
  lDisposable = null
  if atom.workspace.grammarRegistry
      .getGrammars()
      .filter((g) -> g.scopeName == 'source.gv').length == 0
    lDisposable =
      atom.workspace.grammarRegistry.addGrammar (
        atom.workspace
          .grammarRegistry
          .readGrammarSync(
            path.join(__dirname, 'dummy-grammar/language-gv.cson')
          )
      )
  lDisposable
