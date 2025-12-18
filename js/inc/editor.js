

import { ALLOWEDTAGS, editorChangesArray } from "../index.js";

/** The Editor class contains the complete logic of an minimal WYSIWYG editor developed for Eduplanio.
The class is reusable and mostly standalone. To use it set up an editor element that has: 
- a parent container with the class .editorContainer
- a container for the styling buttons with the class .editorButtonContainer, which contains the currently supported buttons with their respective class (boldButton, orderedListButton, unorderedListButton)
- a contenteditable div element with the class .textEditor, which is serves as the textfield.

To access the written contents as a serialized string call the serializeNodeContent method and pass the textEditor element as the 'node' argument and set 'ignoreParent' to true.
*/
export default class Editor {
    /**@param node Returns the elements inner structure as a string. If the parent element should not be included, ignoreParent must be set to true */
    static serializeNodeContent(node, ignoreParent = false) {
        if (node.nodeType == Node.TEXT_NODE && node.textContent.includes('\n')) return node.textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
        if (node.nodeType == Node.TEXT_NODE) return node.textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');


        let nodeText = '';

        if (node.childNodes) {
            node.childNodes.forEach((node) => {
                nodeText += this.serializeNodeContent(node);
            });
        }

        let tagName = node.tagName.toLowerCase();
        if (tagName == 'div') tagName = 'p';

        if (ignoreParent) return nodeText;
        if (!ALLOWEDTAGS.includes(tagName)) return `&lt;${tagName}&gt;${nodeText}&lt;/${tagName}&gt;`;
        if (tagName == 'br') return '<br>';

        return `<${tagName}>${nodeText}</${tagName}>`;
    }

    static normalizeInput(event) {
        const editor = event.target.closest('.textEditor');
        if (!editor) return;

        if (editor.childElementCount == 0 || editor.firstElementChild.tagName == 'DIV') {
            const selection = document.getSelection();
            const range = document.createRange();

            const p = document.createElement('p');
            p.textContent = editor.textContent;
            if (p.textContent.trim() == '') {
                const br = document.createElement('br');
                p.append(br);
            }

            this.clearEditor(editor);
            editor.append(p);

            range.setStart(p, p.textContent.length);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        Array.from(editor.children).forEach(element => {
            if (element.tagName == 'DIV') {
                const p = document.createElement('p');
                const selection = document.getSelection();
                const range = document.createRange();
                const nextNeighbour = element.nextElementSibling;

                const previousAnchor = selection.anchorNode == element ? p : selection.anchorNode;
                const anchorOffSet = selection.anchorOffset;
                const previousFocus = selection.focusNode == element ? p : selection.focusNode;
                const focusOffset = selection.focusOffset;

                while (element.childNodes.length != 0) { p.append(element.firstChild) }
                element.remove();
                editor.insertBefore(p, nextNeighbour);

                range.setStart(previousAnchor, anchorOffSet);
                range.setEnd(previousFocus, focusOffset);

                selection.removeAllRanges();
                selection.addRange(range);
            }
        })
    }

    static updateButtonStatus() {
        const selection = document.getSelection();
        const focusElement = selection.focusNode.nodeType == Node.TEXT_NODE ? selection.focusNode.parentElement : selection.focusNode;
        const editor = focusElement.closest('.textEditor');

        if (!editor) return;

        const editorContainer = editor.parentElement;

        const cursorNode = selection.focusNode;
        const parentElement = cursorNode.parentElement;

        const boldButton = editorContainer.querySelector('.boldButton');
        const oLButton = editorContainer.querySelector('.orderedListButton');
        const uLButton = editorContainer.querySelector('.unorderedListButton');

        //reset all
        uLButton.setAttribute('aria-pressed', 'false');
        oLButton.setAttribute('aria-pressed', 'false');
        boldButton.setAttribute('aria-pressed', 'false');

        //is cursor on a b tag?
        if (parentElement.tagName == 'B' || cursorNode.tagName == 'B') {
            boldButton.setAttribute('aria-pressed', 'true');
        } else {
            boldButton.setAttribute('aria-pressed', 'false');
        }

        //is cursor on a list item? 
        if (parentElement.closest('li')) {
            if (parentElement.closest('ul')) {
                uLButton.setAttribute('aria-pressed', 'true');
            } else {
                uLButton.setAttribute('aria-pressed', 'false');
            }

            if (parentElement.closest('ol')) {
                oLButton.setAttribute('aria-pressed', 'true');
            } else {
                oLButton.setAttribute('aria-pressed', 'false');
            }
        }
    }

    ///////////////////////////////////
    // text manipulation and styling //
    ///////////////////////////////////

    // bold //

    static toggleBoldText() {
        const selection = this.#getTextNodeSelection();

        let startNode = selection.anchorNode, startOffset = selection.anchorOffset;
        let endNode = selection.focusNode, endOffset = selection.focusOffset;

        if (this.#compareNodePosition(startNode, endNode) == 'before') {
            [startNode, endNode] = [endNode, startNode];
            [startOffset, endOffset] = [endOffset, startOffset];
        }

        // if the text is already bold, bold styling should be removed
        if (startNode.parentElement.tagName == 'B' && endNode.parentElement.tagName == 'B') {
            if (endOffset < startOffset) [startOffset, endOffset] = [endOffset, startOffset];
            this.removeBoldText(startNode, startOffset, endNode, endOffset);
            return;
        }

        let startElement = this.#getFirstLevelElement(startNode);

        // if the selection spans only one node
        if (startNode == endNode) {
            if (endOffset < startOffset) [startOffset, endOffset] = [endOffset, startOffset];

            //creates the text node, that should be bold
            let node = startNode.splitText(startOffset);
            node.splitText(endOffset - startOffset);
            if (node.textContent.trim() == '') node.textContent = '\u200B';

            this.#wrapTextNodeInBTag(node, 0, node.textContent.length);
            this.#setSelectionStartOrEndMarker(node, 'startMarker');
            this.#setSelectionStartOrEndMarker(node, 'endMarker');
            this.#restoreSelectionFromMarker();

            return;
        }

        // if the selections spans multiple nodes
        let endNodeReached = false;
        let startAddingTags = false;
        let currentElement = startElement;

        while (!endNodeReached) {
            let nodeList = this.#getAllChildNodes(currentElement);

            nodeList.forEach(node => {
                if (endNodeReached) return
                if (node.nodeType != Node.TEXT_NODE) return;
                if (node.textContent.trim() == '') return;

                if (node == startNode) {
                    startAddingTags = true;
                    node = node.splitText(startOffset);
                    this.#wrapTextNodeInBTag(node, 0, node.textContent.length, 'startNode');
                    this.#setSelectionStartOrEndMarker(node, 'startMarker');

                    return;
                }

                if (node == endNode) {
                    endNodeReached = true;
                    node.splitText(endOffset);
                    this.#wrapTextNodeInBTag(node, 0, node.textContent.length, 'endNode');
                    this.#setSelectionStartOrEndMarker(node, 'endMarker');

                    return;
                }

                if (startAddingTags) this.#wrapTextNodeInBTag(node, 0, node.textContent.length);
            });

            currentElement = currentElement.nextElementSibling;
        }

        this.#restoreSelectionFromMarker();
    }

    /**@param nodeType can be startNode or endNode and inserts a selectionMarker before/after the node, which is later used to restore the user selection */
    static #wrapTextNodeInBTag(node, startOffset, endOffset, nodeType = null) {

        const selection = document.getSelection();
        const range = document.createRange();
        const previousParent = node.parentElement;
        const b = document.createElement('b');
        const invisibleChar = '\u200B';

        range.setStart(node, startOffset);
        range.setEnd(node, endOffset);

        selection.removeAllRanges();
        selection.addRange(range);

        // if (node.textContent.trim() == '') node.textContent = invisibleChar;
        b.append(node);

        //prevent nesting
        if (previousParent.tagName == 'B' && nodeType != null) {
            if (nodeType == 'startNode') previousParent.parentElement.insertBefore(b, previousParent.nextSibling);
            if (nodeType == 'endNode') previousParent.parentElement.insertBefore(b, previousParent);

            if (previousParent.textContent.trim() == '') previousParent.remove();

            return;
        }

        if (previousParent.tagName == 'B') {
            previousParent.replaceWith(b);
            return;
        }

        range.insertNode(b);
    }

    static removeBoldText(startNode, startOffset, endNode, endOffset) {
        let startElement = this.#getFirstLevelElement(startNode);

        if (startNode == endNode) {
            if (startOffset != 0) this.#splitBoldTextNode(startNode, 0, startOffset, 'startNode');
            if (endOffset != startNode.textContent.length) this.#splitBoldTextNode(startNode, endOffset - startOffset, startNode.textContent.length, 'endNode'); //because of the split the endOffset needs to be reduced or the selection will shift by the startOffset amount
            this.#setSelectionStartOrEndMarker(startNode, 'startMarker');
            this.#setSelectionStartOrEndMarker(startNode, 'endMarker');
            this.#removeBoldFromTextNode(startNode);
            this.#restoreSelectionFromMarker();
            return
        }

        let startRemoving = false;
        let endNodeReached = false;

        while (!endNodeReached) {
            let childNodeList = this.#getAllChildNodes(startElement);

            childNodeList.forEach(node => {
                if (endNodeReached) return
                if (node.nodeType != Node.TEXT_NODE) return;
                if (node.textContent.trim() == '') return;
                if (node == startNode) {
                    startRemoving = true;
                    if (startOffset != 0) this.#splitBoldTextNode(node, 0, startOffset, 'startNode');
                    this.#setSelectionStartOrEndMarker(node, 'startMarker');
                }
                if (node == endNode) {
                    endNodeReached = true;
                    if (endOffset != node.textContent.length) this.#splitBoldTextNode(node, endOffset, node.textContent.length, 'endNode');
                    this.#setSelectionStartOrEndMarker(node, 'endMarker');
                }

                if (startRemoving) this.#removeBoldFromTextNode(node);

            });

            startElement.normalize()
            startElement = startElement.nextElementSibling;
        }

        this.#restoreSelectionFromMarker();
    }

    static #splitBoldTextNode(node, startOffset, endOffset, nodeType = null) {
        const selection = document.getSelection();
        const range = document.createRange();

        const marker = document.createElement('span');
        const b = document.createElement('b');

        range.setStart(node, startOffset);
        range.setEnd(node, endOffset);

        selection.removeAllRanges();
        selection.addRange(range);

        let contents = range.extractContents();
        b.textContent = contents.textContent;

        if (nodeType == 'startNode') {
            node.parentElement.parentElement.insertBefore(b, node.parentElement); //insert into the parent of the b tag of the given text node
        }

        if (nodeType == 'endNode') {
            node.parentElement.parentElement.insertBefore(b, node.parentElement.nextSibling); //insert into the parent of the b tag of the given text node
        }
    }

    static #removeBoldFromTextNode(node) {
        if (node.textContent.trim() == '') node.textContent = '\u200B'; //text nodes must not be empty after removing bold around them
        if (node.parentElement.tagName == 'B') {
            node.parentElement.replaceWith(node);
        }
    }

    // lists //

    static toggleList(listType) {
        const selection = this.#getTextNodeSelection();
        const startNode = selection.anchorNode;
        const endNode = selection.focusNode;
        let startElement = this.#getFirstLevelElement(startNode);
        let endElement = this.#getFirstLevelElement(endNode);

        const editor = startElement.closest('.textEditor');

        if (this.#compareNodePosition(startElement, endElement) == 'before') { // start and end are switched
            [startElement, endElement] = [endElement, startElement];
            [selection.anchorNode, selection.focusNode] = [selection.focusNode, selection.anchorNode];
            [selection.anchorOffset, selection.focusOffset] = [selection.focusOffset, selection.anchorOffset];
        }

        if (startElement == endElement) {
            //is already list item -> convert back to p
            if (startElement.parentElement.tagName == 'OL' || startElement.parentElement.tagName == 'UL') {
                const list = startElement.parentElement;

                this.#convertListItemsToPara(startElement);
                this.#extractParagraphsFromList(editor, list);
                this.#removeEmptyList(editor, list);
                this.#restoreSelectionWithoutMarker(selection);

                return;
            }

            if (startElement.parentElement.tagName != 'UL' || startElement.parentElement.tagName != 'OL') {
                this.#wrapElementsInListTag(editor, listType, startElement);
                this.#restoreSelectionWithoutMarker(selection);

                return;
            }

            this.#convertElementToListItem(startElement);
            this.#restoreSelectionWithoutMarker(selection);

            return;
        }

        //selection spans only list items, convert it to p elements
        if (startElement.tagName == 'LI' && endElement.tagName == 'LI') {
            const list = startElement.parentElement;

            this.#convertListItemsToPara(startElement, endElement);
            this.#restoreSelectionWithoutMarker(selection);
            this.#extractParagraphsFromList(editor, list);
            this.#removeEmptyList(editor, list);
            this.#restoreSelectionWithoutMarker(selection);

            return;
        }

        this.#wrapElementsInListTag(editor, listType, startElement, endElement);
        this.#restoreSelectionWithoutMarker(selection);

    }

    static #wrapElementsInListTag(editor, listType, startElement, endElement = null) {
        if (!endElement) endElement = startElement;

        const allChildNodes = this.#getAllChildNodes(editor);
        const listNextNeighbour = endElement.nextElementSibling;
        let listElement = document.createElement(listType);
        let extendExistingList = false;

        //recycle an existing list element, if it fits the user selection and list type
        if ((startElement.parentElement.tagName == 'UL' || startElement.parentElement.tagName == 'OL') && startElement.parentElement.tagName == listType.toUpperCase()) {
            listElement = startElement.parentElement;
            extendExistingList = true;
        }

        let startWrapping = false;
        let endElementReached = false;

        allChildNodes.forEach(node => {
            if (node.nodeType != Node.ELEMENT_NODE) return;
            if (node.tagName == 'OL' || node.tagName == 'UL' || node.tagName == 'B') return;
            if (endElementReached) return;

            if (node == startElement) startWrapping = true;
            if (node == endElement) endElementReached = true;

            if (startWrapping || extendExistingList) {
                if (node.tagName != 'LI') node = this.#convertElementToListItem(node);
                listElement.append(node);
            }
        });

        editor.insertBefore(listElement, listNextNeighbour);

    }

    static #convertElementToListItem(element) {
        const li = document.createElement('li');

        li.append(...element.childNodes);
        element.replaceWith(li);

        return li;
    }

    static #convertListItemsToPara(startElement, endElement = null) {
        if (!endElement) endElement = startElement;

        const childNodeList = this.#getAllChildNodes(startElement.parentElement);
        let startConverting = false;
        let endNodeReached = false;

        childNodeList.forEach(node => {
            if (endNodeReached) return;
            if (node.nodeType == Node.TEXT_NODE) return;
            if (node.tagName == 'UL' || node.tagName == 'OL' || node.tagName == 'B') return;

            if (node == startElement) startConverting = true;
            if (node == endElement) endNodeReached = true;

            if (startConverting) {
                const p = document.createElement('p');
                p.append(...node.childNodes);

                node.replaceWith(p);
            }
        });
    }

    static #extractParagraphsFromList(editor, list) {
        const childElements = Array.from(list.children);
        let listSplit = false; // if a list is split, the first loop should stop processing the children of the initial list

        childElements.forEach(element => {
            if (listSplit) return;
            if (element.tagName == 'P') {
                //if it is the first element, reappend it before the list
                if (!element.previousElementSibling) {
                    editor.insertBefore(element, element.parentElement);
                    return;
                }

                //if it is the last element, reappend it after the list
                if (!element.nextElementSibling) {
                    editor.insertBefore(element, list.nextElementSibling);
                    return;
                }

                //if it is in the middle, split the list
                if (element.previousElementSibling && element.nextElementSibling) {
                    const newList = list.cloneNode();
                    let startMoving = false;
                    listSplit = true;

                    childElements.forEach(child => {
                        if (child == element) startMoving = true;
                        if (startMoving) newList.append(child);
                    });

                    editor.insertBefore(newList, list.nextElementSibling);
                    this.#extractParagraphsFromList(editor, newList);
                    this.#removeEmptyList(editor, newList);
                }
            }
        })
    }

    static #removeEmptyList(editor, list) {
        const childNodeList = this.#getAllChildNodes(list);
        let listItemsFound = false;

        childNodeList.forEach(node => {
            if (node.tagName && node.tagName == 'LI') listItemsFound = true;
        });

        if (!listItemsFound) {
            Array.from(list.children).forEach(element => editor.insertBefore(element, list));
            list.remove();
        }
    }

    //////////////////////
    // helper functions //
    //////////////////////

    static #getAllChildNodes(element) {
        const childNodes = [];

        element.childNodes.forEach(node => {
            getChildNodes(node, childNodes);

            function getChildNodes(node) {
                if (node.nodeType == Node.TEXT_NODE && node.textContent.trim() != '') childNodes.push(node);
                if (node.childNodes.length != 0) {
                    node.childNodes.forEach(node => getChildNodes(node));
                    childNodes.push(node);
                }
            }
        });

        return childNodes;
    }

    /**@param : returns a given nodes parent that sits just one level below the editor container */
    static #getFirstLevelElement(element) {
        const relevantParents = ['P', 'LI'];

        do {
            element = element.parentElement;
        } while (!relevantParents.includes(element.tagName))

        return element;
    }

    /**@param markerType 'startMarker' or 'endMarker', depending on whether it should be placed before or after the given node */
    static #setSelectionStartOrEndMarker(node, markerType) {
        const marker = document.createElement('span');

        if (markerType == 'startMarker') {
            marker.classList.add('startMarker');
            node.parentElement.parentElement.insertBefore(marker, node.parentElement);
        }

        if (markerType == 'endMarker') {
            marker.classList.add('endMarker');
            node.parentElement.parentElement.insertBefore(marker, node.parentElement.nextSibling);
        }
    }

    /**@param :instead of the normal selection API selection object this returns selection where the focusNode and anchorNode are shifted to the closest text node, if those nodes where not text nodes on the browser selection object */
    static #getTextNodeSelection() {
        const selection = document.getSelection();
        const direction = this.#compareNodePosition(selection.anchorNode, selection.focusNode);
        const textNodeSelection = {
            anchorNode: selection.anchorNode,
            focusNode: selection.focusNode,
            anchorOffset: selection.anchorOffset,
            focusOffset: selection.focusOffset,
            isCollapsed: selection.isCollapsed
        };

        if (selection.anchorNode.nodeType != Node.TEXT_NODE) {
            //text was selected left to right
            if (direction == 'after') {
                let childNodes = this.#getAllChildNodes(selection.anchorNode.nextElementSibling);
                childNodes.forEach(node => {
                    if (node.nodeType == Node.TEXT_NODE && node.textContent.trim() != '') textNodeSelection.anchorNode = node;
                });

                textNodeSelection.anchorOffset = 0;
            }

            //text was selected right to left
            if (direction == 'before') {
                let childNodes = this.#getAllChildNodes(selection.anchorNode.previousElementSibling);
                childNodes.forEach(node => {
                    if (node.nodeType == Node.TEXT_NODE && node.textContent.trim() != '') textNodeSelection.anchorNode = node;
                });

                textNodeSelection.anchorOffset = textNodeSelection.anchorNode.textContent.length;
            }
        }

        if (selection.focusNode.nodeType != Node.TEXT_NODE) {
            //text was selected left to right
            if (direction == 'after') {
                let childNodes = this.#getAllChildNodes(selection.focusNode.previousElementSibling);
                childNodes.forEach(node => {
                    if (node.nodeType == Node.TEXT_NODE && node.textContent.trim() != '') textNodeSelection.focusNode = node;
                });

                textNodeSelection.focusOffset = textNodeSelection.focusNode.textContent.length;
            }

            //text was selected right to left
            if (direction == 'before') {
                let childNodes = this.#getAllChildNodes(selection.focusNode.nextElementSibling);
                childNodes.forEach(node => {
                    if (node.nodeType == Node.TEXT_NODE && node.textContent.trim() != '') textNodeSelection.focusNode = node;
                });

                textNodeSelection.focusOffset = 0;
            }
        }

        if (direction == 'same' && selection.anchorNode.nodeType != Node.TEXT_NODE) {
            let childNodes = this.#getAllChildNodes(selection.anchorNode);
            let match = false;
            childNodes.forEach(node => {
                if (node.nodeType == Node.TEXT_NODE) {
                    textNodeSelection.anchorNode = node;
                    textNodeSelection.focusNode = node;
                    match = true;
                }
            });

            //if there is no match, it is an empty html element with a br-tag inside, this must be replaced by an invisible charakter
            if (!match) {
                const invisibleChar = '\u200B';
                textNodeSelection.anchorNode.textContent = invisibleChar;

                textNodeSelection.anchorNode = textNodeSelection.anchorNode.childNodes[0];
                textNodeSelection.focusNode = textNodeSelection.focusNode.childNodes[0];
            }
        }

        return textNodeSelection;
    }

    static #restoreSelectionWithoutMarker(prevSelection) {
        const selection = document.getSelection();
        const range = document.createRange();

        range.setStart(prevSelection.anchorNode, prevSelection.anchorOffset);
        range.setEnd(prevSelection.focusNode, prevSelection.focusOffset);

        selection.removeAllRanges();
        selection.addRange(range);
    }

    static #restoreSelectionFromMarker() {
        const startMarker = document.querySelector('.startMarker');
        const endMarker = document.querySelector('.endMarker');
        const startMarkerParent = startMarker.parentElement;
        const endMarkerParent = endMarker.parentElement;

        const selection = document.getSelection();
        const range = document.createRange();

        const startTextNode = getNeighbouringTextNode(startMarker, 'forward');
        const endTextNode = getNeighbouringTextNode(endMarker, 'backward');

        range.setStart(startTextNode, 0);
        range.setEnd(endTextNode, endTextNode.textContent.length);

        selection.removeAllRanges();
        selection.addRange(range);

        startMarker.remove();
        endMarker.remove();

        startMarkerParent.normalize();
        endMarkerParent.normalize();

        function getNeighbouringTextNode(node, direction) {
            if (node.nodeType == Node.TEXT_NODE && node.textContent.trim() != '') return node;

            let nextNeighbour = direction == 'forward' ? node.nextSibling : node.previousSibling;
            let textNode;

            if (nextNeighbour.nodeType == Node.TEXT_NODE && nextNeighbour.textContent.trim() != '') return nextNeighbour;
            if (nextNeighbour.nodeType == Node.TEXT_NODE && nextNeighbour.textContent.trim() == '') textNode = getNeighbouringTextNode(nextNeighbour, direction);

            if (nextNeighbour.childNodes.length > 0) {
                nextNeighbour.childNodes.forEach(child => textNode = getNeighbouringTextNode(child, direction));
            }

            return textNode;
        }
    }

    /**@param :returns the position of node B compared to node A in the DOM as 'before', 'after' or 'same', if it is the same node  */
    static #compareNodePosition(nodeA, nodeB) {
        const relativePosition = nodeA.compareDocumentPosition(nodeB);
        let order = 'same';
        switch (relativePosition) {
            case Node.DOCUMENT_POSITION_FOLLOWING:
                order = 'after';
                break;
            case Node.DOCUMENT_POSITION_PRECEDING:
                order = 'before';
                break;
        }

        return order;
    }

    static clearEditor(editor, childNode = null) {
        if (!childNode && editor.childNodes.length != 0) { childNode = editor.childNodes[0]; } else { return; }
        if (childNode.childNodes.length != 0) this.clearEditor(editor, childNode.childNodes[0]);

        editor.removeChild(childNode);
    }

    //////////////////////
    // version tracking //
    //////////////////////

    static trackLessonNoteChanges(editor) {
        let currentContent = Editor.serializeNodeContent(editor, true);
        let noteVersion = editorChangesArray.length;

        editorChangesArray.push({ version: noteVersion, content: currentContent });
        Editor.setDisplayedNoteVersion(editor, noteVersion);
    }

    static updateEditorContent(editor, content) {
        editor.innerHTML = content;
    }

    static setDisplayedNoteVersion(editor, version) {
        editor.dataset.noteversion = version;
    }

    static getDisplayedNoteVersion(editor) {
        let displayedVersion = editor.dataset.noteversion;

        if (displayedVersion == '') displayedVersion = 0;

        return Number(displayedVersion);
    }

    static clearLessonNoteChanges() {
        do {
            editorChangesArray.pop();
        } while (editorChangesArray.length != 0);
    }

    static getPreviousChange(displayedVersion) {
        if (displayedVersion == 0) return;
        return editorChangesArray[displayedVersion - 1];
    }

    static getNextChange(displayedVersion) {
        if (displayedVersion == editorChangesArray.length) return;
        return editorChangesArray[displayedVersion + 1];
    }

    static changeNoteVersion(editor, action) {
        let displayedVersion = Editor.getDisplayedNoteVersion(editor);
        let versionToDisplay = null;

        if (action == 'revert') versionToDisplay = Editor.getPreviousChange(displayedVersion);
        if (action == 'redo') versionToDisplay = Editor.getNextChange(displayedVersion);

        if (!versionToDisplay) return;

        Editor.updateEditorContent(editor, versionToDisplay.content);
        Editor.setDisplayedNoteVersion(editor, versionToDisplay.version);
    }

    ///////////////////
    // event handler //
    ///////////////////

    static handleClickEvents(event) {
        const clickedElement = event.target;
        const editorContainer = clickedElement.closest('.editorContainer');
        const editor = editorContainer.querySelector('.textEditor');

        switch (clickedElement.id) {
            // editor styling buttons
            // case 'boldButton':
            //     Editor.toggleBoldText(event);
            //     Editor.trackLessonNoteChanges(editor);
            //     break;
            // case 'unorderedListButton':
            //     Editor.toggleList('ul');
            //     Editor.trackLessonNoteChanges(editor);
            //     break;
            // case 'orderedListButton':
            //     Editor.toggleList('ol');
            //     Editor.trackLessonNoteChanges(editor);
            //     break;

        }

        switch (true) {
            case clickedElement.classList.contains('boldButton'):
                Editor.toggleBoldText(event);
                Editor.trackLessonNoteChanges(editor);
                break;
            case clickedElement.classList.contains('unorderedListButton'):
                Editor.toggleList('ul');
                Editor.trackLessonNoteChanges(editor);
                break;
            case clickedElement.classList.contains('orderedListButton'):
                Editor.toggleList('ol');
                Editor.trackLessonNoteChanges(editor);
                break;

            //change edit version forward/backward
            case clickedElement.classList.contains('revertChangeButton'):
                Editor.changeNoteVersion(editor, 'revert');
                break;
            case clickedElement.classList.contains('redoChangeButton'):
                Editor.changeNoteVersion(editor, 'redo');
                break;
        }
    }

    static handleKeyDownEvents(event) {
        const key = event.code;
        const editorContainer = event.target.closest('.editorContainer');
        const editor = editorContainer.querySelector('.textEditor');

        switch (key) {
            case 'Escape':
                event.preventDefault();

                break;

            case 'Space':
            case 'Backspace':
            case 'Delete':
            case 'Enter':
            case 'Period':
            case 'Digit1': //exclamtion mark
            case 'Minus': //question mark
                setTimeout(() => { Editor.trackLessonNoteChanges(editor); }, 100);
                break;

            case 'KeyY':
                if (event.getModifierState('Control') || event.getModifierState('Meta')) {
                    event.preventDefault();
                    Editor.changeNoteVersion(editor, 'revert');
                }
                break;
            case 'KeyZ':
                if (event.getModifierState('Control') || event.getModifierState('Meta')) {
                    event.preventDefault();
                    Editor.changeNoteVersion(editor, 'redo');
                }
                break;
        }
    }
}