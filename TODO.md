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
- [ ] croping through annotations

7. Download

- [x] deselect annotaions when downloading

## Details

- [x] text rect should have transparent background
- [x] make more padding to last tool
- [x] make arrow tool default
- [x] revisit crop area on white background, it looks too thin
- [x] update crop area border when text tool designed
- [x] disable button "Annotate screenshot" on annotation page
- [x] change cursors when moving endpoints or annotations (reference to crop tool - if applicable?) - check only for line and arrow, everything else is fine
- [x] change color of annotations to use color E74C3C
- [ ] screenshot should start at the bottom of topbar
- [x] style "Uh-oh, there's no screenshot to annotate!" page
- [x] add shadow to toolbar
- [x] exclude extension-presentation from build
- [x] change "environment details" to "system info"
- [x] when hovering over rectangle, highlight is visible only when hover over horizontal parts
- [x] find a way to have better hover color for secondary button (as current is too pale)
- [ ] Recheck annotations when scrolling

## Ongoing

- [ ] increase code coverage
- [ ] update badges with coverage (or integrate Codecov)

## Final

- test all annotations
  - [ ] on non-retina white background
  - [ ] on non-retina dark background
  - [ ] on retina white background
  - [ ] on retina dark background
