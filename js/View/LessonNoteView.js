import LessonNoteController from "../Controller/LessonNoteController.js";
import AbstractView from "./AbstractView.js";
import Fn from "../inc/utils.js";
import { ALLOWEDTAGS } from "../index.js";

export default class LessonNoteView extends AbstractView {
    static async renderLessonNotesModal(event) {
        const lesson = event.target.closest('.lesson');
        const className = lesson.dataset.class;
        const subject = lesson.dataset.subject;
        const date = lesson.closest('.weekday').dataset.date;
        const timeslot = lesson.closest('.timeslot').dataset.timeslot;
        const weekday = lesson.closest('.weekday').dataset.weekday_number;
        const lessonNotes = await LessonNoteController.getAllLessonNotesInTimeRange(date);

        let matchedNote;

        lessonNotes.forEach(note => {
            if (Fn.formatDate(note.date) != Fn.formatDate(date)) return;
            if (note.timeslot != timeslot) return;
            if (note.class != className) return;
            if (note.subject != subject) return;

            matchedNote = note;
        })

        const dialog = document.querySelector('#lessonNoteDialog');
        const editor = dialog.querySelector('#noteContentEditor');

        dialog.dataset.class = className;
        dialog.dataset.subject = subject;
        dialog.dataset.date = date;
        dialog.dataset.timeslot = timeslot;
        dialog.dataset.weekday = weekday;

        if (matchedNote) {

            dialog.dataset.noteid = matchedNote.id;
            dialog.dataset.created = matchedNote.created;
            editor.innerHTML = matchedNote.content;
        }

        if (!matchedNote) {
            const p = document.createElement('p');
            p.classList.add('placeholder');
            editor.append(p);
            editor.firstElementChild.innerHTML = 'Hier kannst du eine Notiz zur Stunde anlegen.'
        }

        dialog.showModal();
    }

    static getNoteDataFromForm() {
        const dialog = document.querySelector('#lessonNoteDialog');
        const editor = dialog.querySelector('#noteContentEditor');
        let content = '';

        //wrap text nodes with actual content in p elements
        editor.childNodes.forEach(node => {
            if (node.nodeType == Node.TEXT_NODE && node.textContent.trim() != '') {
                const p = document.createElement('p');
                p.textContent = node.textContent;
                node.replaceWith(p);
            }
        })

        content = this.serializeNodeContent(editor, true);

        return {
            id: dialog.dataset.noteid,
            class: dialog.dataset.class,
            subject: dialog.dataset.subject,
            date: dialog.dataset.date,
            weekday: dialog.dataset.weekday,
            timeslot: dialog.dataset.timeslot,
            created: dialog.dataset.created,
            content: content
        }
    }
    /**@param node Returns the elements inner structure as a string. If the parent element should not be included, ignoreParent must be set to true */
    static serializeNodeContent(node, ignoreParent = false) {
        if (node.nodeType == Node.TEXT_NODE && node.textContent.includes('\n')) return node.textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
        if (node.nodeType == Node.TEXT_NODE) return node.textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');


        let nodeText = '';

        if (node.childNodes) {
            node.childNodes.forEach((node) => {
                nodeText += LessonNoteView.serializeNodeContent(node);
            });
        }

        let tagName = node.tagName.toLowerCase();
        if (tagName == 'div') tagName = 'p';

        if (ignoreParent) return nodeText;
        if (!ALLOWEDTAGS.includes(tagName)) return `&lt;${tagName}&gt;${nodeText}&lt;/${tagName}&gt;`;
        if (tagName == 'br') return '<br>';

        return `<${tagName}>${nodeText}</${tagName}>`;
    }

    static closeLessonNotesDialog() {
        const dialog = document.querySelector('#lessonNoteDialog');
        const editor = dialog.querySelector('#noteContentEditor');

        dialog.dataset.noteid = '';
        dialog.dataset.class = '';
        dialog.dataset.subject = '';
        dialog.dataset.date = '';
        dialog.dataset.timeslot = '';
        dialog.dataset.weekday = '';
        dialog.dataset.created = '';

        while (editor.childNodes.length != 0) { editor.childNodes[0].remove(); }

        dialog.close();
    }

    static removePlaceholderText() {
        const editor = document.querySelector('#noteContentEditor');

        if (editor.firstElementChild.classList.contains('placeholder')) {
            editor.firstElementChild.innerHTML = '<br>';
            editor.firstElementChild.classList.remove('placeholder');
        }
    }

    static normalizeInput() {
        const editor = document.querySelector('#noteContentEditor');

        editor.childNodes.forEach(node => {
            if (node.nodeType == Node.TEXT_NODE && node.textContent.trim() != '') {
                const selection = document.getSelection();
                const range = document.createRange();

                const p = document.createElement('p');
                p.textContent = node.textContent;
                node.replaceWith(p);

                range.setStart(p, p.textContent.length);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });
    }

    //text manipulation and styling
    static addBoldText() {
        const selection = this.#getSelection();

        if (selection.isCollapsed) return;

        let startNode = selection.anchorNode, startOffset = selection.anchorOffset;
        let endNode = selection.focusNode, endOffset = selection.focusOffset;

        console.log(endNode);

        if (this.#compareNodePosition(startNode, endNode) == 'before') {
            [startNode, endNode] = [endNode, startNode];
            [startOffset, endOffset] = [endOffset, startOffset];
        }

        // if the text is already bold, bold styling should be removed
        if (startNode.parentElement.tagName == 'B' && endNode.parentElement.tagName == 'B') {
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

            this.#wrapTextNodeInBTag(node, 0, node.textContent.length);
            this.#setSelectionStartOrEndMarker(node, 'startMarker');
            this.#setSelectionStartOrEndMarker(node, 'endMarker');
            this.#restoreSelection();

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

        this.#restoreSelection();
    }

    /**@param nodeType can be startNode or endNode and inserts a selectionMarker before/after the node, which is later used to restore the user selection */
    static #wrapTextNodeInBTag(node, startOffset, endOffset, nodeType = null) {
        // if (node.parentElement.tagName == 'B' && !nodeType) return

        const selection = document.getSelection();
        const range = document.createRange();
        const previousParent = node.parentElement;

        range.setStart(node, startOffset);
        range.setEnd(node, endOffset);

        selection.removeAllRanges();
        selection.addRange(range);

        const b = document.createElement('b');
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
            this.#restoreSelection();
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

        this.#restoreSelection();
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
        if (node.parentElement.tagName == 'B') {
            node.parentElement.replaceWith(node);
        }
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

    static updateButtonStatus() {
        const selection = document.getSelection();
        const cursorNode = selection.focusNode;
        const parentElement = cursorNode.parentElement;

        const boldButton = document.querySelector('#boldButton');
        const oLButton = document.querySelector('#orderedListButton');
        const uLButton = document.querySelector('#unorderedListButton');

        switch (parentElement.tagName) {
            case 'B':
                boldButton.setAttribute('aria-pressed', 'true');
                if (parentElement.closest('ul')) uLButton.setAttribute('aria-pressed', 'true');
                if (parentElement.closest('ol')) oLButton.setAttribute('aria-pressed', 'true');
                break;
            case 'P':
                boldButton.setAttribute('aria-pressed', 'false');
                uLButton.setAttribute('aria-pressed', 'false');
                oLButton.setAttribute('aria-pressed', 'false');
                break;
        }
    }

    // helper functions

    static #getAllChildNodes(element) {
        console.log(element)
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
        while (element.parentElement != document.querySelector('#noteContentEditor')) {
            element = element.parentElement;
        }

        return element;
    }

    /**@param :instead of the normal selection API selection object this returns selection where the focusNode and anchorNode are shifted to the closest text node, if those nodes where not text nodes on the browser selection object */
    static #getSelection() {
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

        return textNodeSelection;
    }

    static #restoreSelection() {
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
}