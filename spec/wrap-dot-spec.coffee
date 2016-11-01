wrap = require '../lib/wrap-dot'

describe "native dot wrapper", ->

  it "returns an error wheh passed a non-existant executable name", ->
    wrap.render 'graph { a -- b [label="okiedokie"]}', ((err, ok) ->
      expect(ok).toBe undefined),
      {exec: 'nonexistant'}
