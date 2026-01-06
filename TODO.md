# TODO

# Main functionalities 

1. Select tool

- [x] on hover stroke annotation
- [x] if no annotation is clicked, unselect all annotations 
- [x] if coming from other tool, don't select any annotation
- [x] delete key deletes selected annotation

2. Line tool

- draw line
  - [x] free
  - [x] with shift
- move endpoint
  - [x] start endpoint
  - [x] end endpoint
- move line
  - [x] without selection
  - [x] with selection

3. Arrow tool

- draw arrow
  - [x] free
  - [x] with shift
- move endpoint
  - [x] start endpoint
  - [x] end endpoint
- move arrow
  - [x] without selection
  - [x] with selection

4. Rectangle tool

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

5. Crop tool

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
- [ ] croping through annotations
 
6. Download

- [x] deselect annotaions when downloading

## Extra

- [ ] crop buttons, green?
- [x] revisit crop area on white background, it looks too thin
- [x] update crop area border when text tool designed
- [ ] disable buttons "Annotate screenshot" / or show instructionswhen in annotations mode
- [ ] when moving array via endpoint (start or end), it sometimes goes to select tool when release mouse button
- [ ] change cursors when moving endpoints or annotations (reference to crop tool - if applicable?) - check only for line and arrow, everything else is fine
- [x] change color of annotations to use color E74C3C
- [ ] screenshot should start at the bottom of topbar
- [ ] style "No screenshot loaded. Please capture a screenshot from the extension popup."
- [x] add shadow to toolbar
- [x] exclude extension-presentation from build
- [x] change "environment details" to "system info"
- [x] when hovering over rectangle, highlight is visible only when hover over horizontal parts
- [x] find a way to have better hover color for secondary button (as current is too pale)
- [ ] increase code coverage
- [ ] figure out how to avoid "tabs" permission
- [ ] revisit toolbar - last tool perhaps needs more optical padding
- [ ] integrate Codecov