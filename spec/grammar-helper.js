"use babel";

import path from "path";

export function makeSureGrammarExists() {
  let lDisposable = null;

  if (
    !atom.workspace.grammarRegistry
      .getGrammars()
      .some((pG) => pG.scopeName === "source.gv")
  ) {
    lDisposable = atom.workspace.grammarRegistry.addGrammar(
      atom.workspace.grammarRegistry.readGrammarSync(
        path.join(__dirname, "dummy-grammar/language-gv.cson")
      )
    );
  }
  return lDisposable;
}
/* global atom */
/* eslint import/prefer-default-export: 0 */
