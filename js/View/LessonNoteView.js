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

        console.log('string', content);

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
        console.log('input')
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
        const selection = document.getSelection();
        const range = document.createRange();

        let startNode = selection.anchorNode, startOffset = selection.anchorOffset;
        let endNode = selection.focusNode, endOffset = selection.focusOffset;

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
            this.#wrapTextNodeInBTag(startNode, startOffset, endOffset);
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
                    this.#wrapTextNodeInBTag(node, startOffset, node.textContent.length, 'startNode');
                    return;
                }
                if (node == endNode) {
                    endNodeReached = true;
                    this.#wrapTextNodeInBTag(node, 0, endOffset, 'endNode');
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
        if (node.parentElement.tagName == 'B') return;
        const selection = document.getSelection();
        const range = document.createRange();

        range.setStart(node, startOffset);
        range.setEnd(node, endOffset);

        selection.removeAllRanges();
        selection.addRange(range);

        const b = document.createElement('b');
        b.append(range.extractContents());
        range.insertNode(b);

        if (nodeType == 'startNode') {
            const marker = document.createElement('span');
            marker.classList.add('startMarker');
            range.collapse(true);
            range.insertNode(marker);
        }

        if (nodeType == 'endNode') {
            const marker = document.createElement('span');
            marker.classList.add('endMarker');
            range.collapse(false);
            range.insertNode(marker);
        }
    }

    static removeBoldText(startNode, startOffset, endNode, endOffset) {
        let startElement = this.#getFirstLevelElement(startNode);

        if (startNode == endNode) {
            if (startOffset != 0) this.#splitBoldTextNode(startNode, 0, startOffset, 'startNode');
            console.log(startNode)
            if (endOffset != startNode.textContent.length) this.#splitBoldTextNode(startNode, endOffset - startOffset, startNode.textContent.length, 'endNode'); //because of the split the endOffset needs to be reduced or the selection will shift by the startOffset amount
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
                }
                if (node == endNode) {
                    endNodeReached = true;
                    if (endOffset != node.textContent.length) this.#splitBoldTextNode(node, endOffset, node.textContent.length, 'endNode');
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

        console.log(node);

        range.setStart(node, startOffset);
        range.setEnd(node, endOffset);

        selection.removeAllRanges();
        selection.addRange(range);

        let contents = range.extractContents();
        b.textContent = contents.textContent;

        if (nodeType == 'startNode') {
            marker.classList.add('startMarker');
            node.parentElement.parentElement.insertBefore(b, node.parentElement); //insert into the parent of the b tag of the given text node
            node.parentElement.parentElement.insertBefore(marker, node.parentElement);
        }

        if (nodeType == 'endNode') {
            marker.classList.add('endMarker');
            node.parentElement.parentElement.insertBefore(b, node.parentElement.nextSibling); //insert into the parent of the b tag of the given text node
            node.parentElement.parentElement.insertBefore(marker, node.parentElement.nextSibling);
        }
    }

    static #removeBoldFromTextNode(node) {
        node.parentElement.replaceWith(node)
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

    static #getFirstLevelElement(element) {
        while (element.parentElement != document.querySelector('#noteContentEditor')) {
            element = element.parentElement;
        }

        return element;
    }

    static #restoreSelection() {
        const startMarker = document.querySelector('.startMarker');
        const endMarker = document.querySelector('.endMarker');
        const selection = document.getSelection();
        const range = document.createRange();

        range.setStartAfter(startMarker);
        range.setEndBefore(endMarker);

        selection.removeAllRanges();
        selection.addRange(range);

        startMarker.remove();
        endMarker.remove();
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