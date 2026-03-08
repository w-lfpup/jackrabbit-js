Create a set of utilities for jackrabbit tests.

Webdriver: provide a minimal amount of actions to test web components and DOM operations.

FROM THE PERSPECTIVE of a test module.

getElement("css selector");
getElements("css selector");

Functions

- Get element
- pointer down / move / up actions
- key down / up actions
- release actions
- screenshot element (fixture or actual element)
- DOM tests: interfaces to maintain dom

Interfaces

- a fixture / hangar for elements to be contained
- an "await till next render / queue"
- if possible an "await till all animations are complete"
