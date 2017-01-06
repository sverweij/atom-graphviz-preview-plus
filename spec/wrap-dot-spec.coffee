wrap = require '../lib/wrap-dot'

describe "native dot wrapper", ->
  if process.platform != 'win32'
    it "returns an error when passed a non-existant executable name", ->
      wrap.render 'graph { a -- b [label="okiedokie"]}', ((err, ok) ->
        expect(ok).toBe undefined),
        {exec: 'nonexistant'}
  else
    it "skips a test because on win32 expecting an error works unexpectantly", ->
      expect("MS-DOS").toContain "DOS"
