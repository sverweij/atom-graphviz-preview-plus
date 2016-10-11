renderer = require '../lib/renderer'

describe "renderer", ->

  it "a valid program renders as an svg", ->
    renderer.render 'graph { a -- b [label="okiedokie"]}', (err, ok) ->
      expect(err).toBe null and expect(ok).toContain('<svg ')

  it "an invalid program returns an error", ->
    renderer.render 'this is an invalid program', (err, ok) ->
      expect(err.message).toContain "Error: syntax error in line 1 near 'this'"
      expect(ok).toBe undefined

  it "recovers from an error viz.js doesn't recover from", ->
    renderer.render 'graph {a --b [label="unrecoverable]}', (err, ok) ->
      expect(err.message).toContain "Error: syntax error in line 1 near"
      expect(ok).toBe undefined
      renderer.render 'graph {a --b [label="unrecoverable]}', (err, ok) ->
        expect(err.message).toContain "Error: syntax error in line 1 near"
        expect(ok).toBe undefined
        renderer.render 'graph {a --b [label="unrecoverable]}', (err, ok) ->
          expect(err.message).toContain "Error: syntax error in line 1 near"
          expect(ok).toBe undefined
          renderer.render 'graph {a --b [label="unrecoverable"]}', (err, ok) ->
            expect(ok).toContain '<svg '
            expect(err).toBe null
