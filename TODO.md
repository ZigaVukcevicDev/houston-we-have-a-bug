# TODO

# Main functionalities

1. Select tool

- [x] on hover stroke annotation
- [x] if no annotation is clicked, unselect all annotations
- [x] if coming from other tool, don't select any annotation
- [x] delete key deletes selected annotation

2. Text tool

- draw rectangle
  - [x] free
  - [x] prevents left and top draw
  - [x] upon release user is able to type, select tool is being selected, handles are visible
- move endpoint (handled by select tool)
  - [x] top-left endpoint
  - [x] top-right endpoint
  - [x] bottom-left endpoint
  - [x] bottom-right endpoint
  - [x] has proper cursor
- move rectangle (handled by select tool)
  - [x] without selection
  - [x] with selection
  - [x] has proper cursor

3. Line tool

- draw line
  - [x] free
  - [x] with shift
- move endpoint
  - [x] start endpoint
  - [x] end endpoint
- move line
  - [x] without selection
  - [x] with selection

4. Arrow tool

- draw arrow
  - [x] free
  - [x] with shift
- move endpoint
  - [x] start endpoint
  - [x] end endpoint
- move arrow
  - [x] without selection
  - [x] with selection

5. Rectangle tool

- draw rectangle
  - [x] free
  - [x] with shift
- move endpoint
  - [x] top-left endpoint
  - [x] top-right endpoint
  - [x] bottom-left endpoint
  - [x] bottom-right endpoint
  - [x] has proper cursor
- move rectangle
  - [x] without selection
  - [x] with selection
  - [x] has proper cursor

6. Crop tool

- draw crop rectangle
  - [x] free
  - [x] with shift
- deselect crop rectangle
  - [x] selecting any other tool
  - [x] pressing escape (then switch to select tool automatically)
- move crop endpoints
  - [x] top-left endpoint
  - [x] top-right endpoint
  - [x] bottom-left endpoint
  - [x] bottom-right endpoint
  - [x] left endpoint
  - [x] right endpoint
  - [x] top endpoint
  - [x] bottom endpoint
- move crop rectangle
  - [x] on hover crop rectangle
- minimum dimensions
  - [x] on init
  - [x] on resize
- confirm crop
  - [x] clicking button
  - [x] with enter
- cancel crop
  - [x] clicking button
  - [x] with escape
  - [x] by selecting other tool
- [ ] cropping through annotations

7. Download

- [x] deselect annotations when downloading

## Details

- [x] merge instructions.md and .clinerules
- [x] update contributing file
- [x] text rect should have transparent background
- [x] make more padding to last tool
- [x] make arrow tool default
- [x] revisit crop area on white background, it looks too thin
- [x] update crop area border when text tool designed
- [x] disable button "Annotate screenshot" on annotation page
- [x] change cursors when moving endpoints or annotations (reference to crop tool - if applicable?) - check only for line and arrow, everything else is fine
- [x] change color of annotations to use color E74C3C
- [x] screenshot should start at the bottom of top bar
- [x] style "Uh-oh, there's no screenshot to annotate!" page
- [x] add shadow to toolbar
- [x] exclude extension-presentation from build
- [x] change "environment details" to "system info"
- [x] when hovering over rectangle, highlight is visible only when hover over horizontal parts
- [x] find a way to have better hover color for secondary button (as current is too pale)
- [x] text tool - changing textarea to editable div
- [x] text tool - when I draw text area and click outside, the text jumps up
- [x] text tool - less padding space in editable div, 5px
- [x] text tool - it should be moveable (upon hover and clicking/dragging over border)
- [x] text tool - increase font size to 15px
- [x] text tool - darkenColor is not applied when writing text, also cursor
- [x] text tool - fix text not to be scrollable when not fitting vertically (it works ok when clicking outside)
- [x] text tool - set minimum width and height of 40px when creating or resizing
- [x] text tool - make border transparent when clicking outside
- [x] text tool - when hovering over textbox and showing border, it should work also for hovering over overflown text
- [ ] text tool - select all / highlight color (update design)
- [x] text tool - when deleting text, annotation gets deleted
- [x] text tool - if no text entered and try to resize, the annotation disappears
- [x] text tool - minimal dimensions should not be applied at init
- [x] text tool - remove border opacity 40%, it should always be 100%
- [x] text tool - when typing text, cursor should be for text, not move
- [x] text tool - revisit if user can't resize in negative directions
- [x] recheck annotations when scrolling
- [x] screenshot is horizontally scrollable
- [x] does test html needs to be in build/dist?
- [x] update readme file structure with e2e tests
- [x] write e2e tests for crop tool
- [x] write e2e tests for download and system info
- [x] add license
- [x] align canvas to the center in test file
- [x] array, line and rectangle tool - when select it (click), change pointer cursor to move cursor

## Ongoing

- [ ] increase code coverage
- [ ] increase E2E tests
- [ ] update badges with coverage

## Final

- test all annotations
  - [ ] on non-retina white background
  - [ ] on non-retina dark background
  - [ ] on retina white background
  - [ ] on retina dark background
