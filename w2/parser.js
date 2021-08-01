const css = require('css');
let currentToken = null
let currentAttribute = null;
let stack = [
  {
    type: 'document',
    children: []
  }
]
let currentText = ''

let rules = [];
function addCssRules(text) {
  const ast = css.parse(text);
  rules.push(...ast.stylesheet.rules);
}

function computeCss(element) {
  let elements = stack.slice().reverse()
  if (!element.computedStyle) {
    element.computedStyle = {}
  }
  for (let rule of rules) {
    let selectorParts = rule.selectors[0].split(' ').reverse();

    if (!match(element, selectorParts[0])) {
      continue
    }
    let matched = false
    let j = 1;
    for (let i = 0; i < elements; i++) {
      if (match(elements[i], selectorParts[j])) {
        j++
      }
    }

    if (j >= selectorParts.length) {
      matched = true
    }

    if (matched) {
      let sp = specificity(rule.selectors[0])
      let computedStyle = element.computedStyle
      for (let d of rule.declarations) {
        if (!computedStyle[d.property]) {
          computedStyle[d.property] = {}
        }
        if (!computedStyle.sp) {
          computedStyle[d.property].value = d.value
          computedStyle.sp = sp;
        } else if (compare(sp, computedStyle.sp)) {
          computedStyle[d.property].value = d.value
          computedStyle.sp = sp;
        }

      }
      console.log(computedStyle)
    }

  }

}

function specificity(selectors) {
  let sp = [0, 0, 0, 0];
  const selectorsArr = selectors.split(' ');
  for (let selector in selectorsArr) {
    if (selector.charAt(0) === '#') {
      sp[1] = sp[1] + 1;
    } else if (selector.charAt(0) === '.') {
      sp[2] = sp[2] + 1;
    } else {
      sp[3] = sp[3] + 1;
    }
  }
  return sp
}

function compare(sp1, sp2) {
  if (sp1[0] - sp2[0]) {
    return sp1[0] - sp2[0]
  }

  if (sp1[1] - sp2[1]) {
    return sp1[1] - sp2[1]
  }
  if (sp1[2] - sp2[2]) {
    return sp1[2] - sp2[2]
  }

  return sp1[3] - sp2[3]
}


function match(element, selector) {
  if (!element.attributes || !selector) {
    return false;
  }
  if (selector.charAt(0) === '#') {
    let attr = element.attributes.filter(attribute => attribute.name === "id")
    if (attr[0] && attr[0].value === selector.replace('#', '')) {
      return true
    }
  } else if (selector.charAt(0) === '.') {
    let attr = element.attributes.filter(attribute => attribute.name === "class")
    if (attr[0] && attr[0].value === selector.replace('.', '')) {
      return true
    }
  } else {
    if (element.tagName === selector) {
      return
    }
  }
  return false
}

function emit(token) {

  let current = stack[stack.length - 1];
  if (token.type === 'startTag') {

    let childrenElement = {
      type: 'element',
      children: [],
      attributes: []
    }
    childrenElement.tagName = token.tagName;

    for (let p in token) {
      if (p !== 'tagName' && p !== 'type') {
        childrenElement.attributes.push({
          name: p,
          value: token[p]
        })
      }
    }
    computeCss(childrenElement);
    current.children.push(childrenElement);
    childrenElement.parent = current;
    if (!token.isSelfClosing) {
      stack.push(childrenElement);
    }
    currentText = null;
  } else if (token.type === 'endTag') {
    if (current.tagName !== token.tagName) {
      throw Error('tag not match')
    } else {
      if (token.tagName === 'style') {
        addCssRules(current.children[0].content);
      }
      stack.pop();
    }
    currentText = null;
  } else if (token.type === 'text') {
    if (!currentText) {
      currentText = {
        type: 'text',
        content: ""
      }
      current.children.push(currentText);
    }
    currentText.content += token.content
  }
}
const EOF = Symbol('EOF') // end of file

function data(s) {
  if (s === '<') {
    return tagOpen
  } else if (s === EOF) {
    emit({
      type: "EOF"
    })
    return
  } else {
    emit({
      type: 'text',
      content: s
    })
    return data
  }
}

function tagOpen(s) {
  if (s.match(/[a-zA-z]/)) {
    currentToken = {
      type: 'startTag',
      tagName: ""
    }
    return tagName(s)
  } else if (s === '/') {
    return endTagOpen
  } else {
    return;
  }
}

function endTagOpen(s) {
  if (s.match(/[a-zA-z]/)) {
    currentToken = {
      type: 'endTag',
      tagName: ""
    }
    return tagName(s)
  } else if (s === '>') {
  } else if (s === EOF) {
  } else {
    return;
  }
}

function tagName(s) {
  if (s.match(/^[\t\f\n ]$/)) {
    return beforAttributeName
  } else if (s === '/') {
    return selfClosingStartTag
  } else if (s.match(/[a-zA-z]/)) {
    currentToken.tagName += s
    return tagName
  } else if (s === '>') {
    emit(currentToken)
    return data
  } else {
    return tagName
  }
}
function beforAttributeName(s) {
  if (s.match(/^[\t\f\n ]$/)) {
    return beforAttributeName
  } else if (s === '=') {

  } else if (s === '>' || s === '/' || s === EOF) {
    return afterAttributeName(c)
  } else {
    currentAttribute = {
      name: "",
      value: ""
    }
    return attributeName(s)
  }
}


function beforeAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeValue;
  } else if (c == "/" || c == ">" || c == EOF) {
    return affterAttributeName(c);
  } else if (c == "=") {

  } else {
    currentAttribute = {
      name: "",
      value: ""
    }
    return attributeName(c);
  }
}

function attributeName(s) {
  if (s.match(/^[\t\f\n ]$/) || s === '>' || s === '/' || s === EOF) {
    return afterAttributeName(s)
  } else if (s === '=') {
    return beforeAttributeValue
  } else if (s === "\u0000") {

  } else if (s === '\"' || s === "'" || s === "<") {

  } else {
    currentAttribute.name += s
    return attributeName
  }
}
function beforeAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeValue;
  } else if (c == "/" || c == ">" || c == EOF) {
    return affterAttributeName(c);
  } else if (c == "=") {

  } else {
    currentAttribute = {
      name: "",
      value: ""
    }
    return attributeName(c);
  }
}
function beforeAttributeName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName;
  } else if (c == "/" || c == ">" || c == EOF) {
    return affterAttributeName(c);
  } else if (c == "=") {

  } else {
    currentAttribute = {
      name: "",
      value: ""
    }
    return attributeName(c);
  }
}
function beforeAttributeValue(s) {
  if (s.match(/^[\t\f\n ]$/) || s === '>' || s === '/' || s === EOF) {
    return beforeAttributeName
  } else if (s === '\"') {
    return doubleQuotedAttributeValue
  } else if (s === '\'') {
    return singleQuotedAttributeValue
  } else if (s === ">") {

  } else {
    return unquotedAttributeValue(s)
  }
}

function doubleQuotedAttributeValue(s) {
  if (s === "\"") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return affterQuotedAttributeValue;
  } else if (s === "\u0000") {

  } else if (s === EOF) {

  } else {
    currentAttribute.value += s;
    return doubleQuotedAttributeValue;
  }
}

function singleQuotedAttributeValue(s) {
  if (s == "\'") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return affterQuotedAttributeValue;
  } else if (s == "\u0000") {

  } else if (s == EOF) {

  } else {
    currentAttribute.value += s;
    return doubleQuotedAttributeValue;
  }
}

function affterQuotedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName;
  } else if (c == "/") {
    return selfClosingStartTag;
  } else if (c == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (c == EOF) {

  } else {
    currentAttribute.value += c;
    return doubleQuotedAttributeValue;
  }
}

function unquotedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return beforeAttributeName;
  } else if (c == "/") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return selfClosingStartTag;
  } else if (c == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (c == "\u0000") {

  } else if (c == "\"" || c == "'" || c == "<" || c == "=" || c == "`") {

  } else if (c == EOF) {

  } else {
    currentAttribute.value += c;
    return unquotedAttributeValue;
  }
}

function selfClosingStartTag(s) {
  if (s === '>') {
    currentToken.isSelfClosing = true
    emit(currentToken);
    return data;
  } else if (s === EOF) {

  } else {

  }
}
function affterAttributeName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return affterAttributeName;
  } else if (c == "/") {
    return selfClosingStartTag;
  } else if (c == "=") {
    return beforeAttributeValue;
  } else if (c == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (c == EOF) {

  } else {
    currentToken[currentAttribute.name] = currentAttribute.value;
    currentAttribute = {
      name: "",
      value: ""
    };
    return attributeName(c);
  }
}

module.exports.parserHtml = function parserHtml(html) {
  let state = data
  for (let c of html) {
    state = state(c);
  }
  state = EOF;
  console.log(stack);
}

