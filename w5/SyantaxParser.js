import { scan } from './lexer.js'

let syantanx = {
  Program: [['StatementList', "EOF"]],
  StatementList: [
    ['Statement'],
    ['StatementList', 'Statement'],
  ],
  Statement: [
    ["ExpressionStatement"],
    ["IfStatement"],
    ["VariableDeclaration"],
    ["FunctionDeclaration"],
  ],
  IfStatement: [
    ["if", "(", "Expression", ")", "Statement"]
  ],
  VariableDeclaration: [
    ["var", "Indentifier", ";"],
    ["let", "Indentifier", ";"],
  ],
  FunctionDeclaration: [
    ["function", "Indentifier", "(", ")", "{", "Statement", "}"]
  ],
  ExpressionStatement: [
    ["Expression", ";"]
  ],
  Expression: [
    ["AdditiveExpression"]
  ],
  AdditiveExpression: [
    ["MultiplicativeExpression"],
    ["AdditiveExpression", "+", "MultiplicativeExpression"],
    ["AdditiveExpression", "-", "MultiplicativeExpression"]
  ],
  MultiplicativeExpression: [
    ["PrimaryExpression"],
    ["MultiplicativeExpression", "*", "PrimaryExpression"],
    ["MultiplicativeExpression", "/", "PrimaryExpression"]
  ],
  PrimaryExpression: [
    ["(", "Expression", ")"],
    ["Literal"],
    ["Indentifier"]
  ],
  Literal: [
    ["Number"],
    ["String"],
    ["Boolean"]
    ["Null"],
    ["RegularExpression"]

  ]
}

let hash = {

}

function closure(state) {
  hash[JSON.stringify(state)] = state
  let queue = []
  for (let symbol in state) {
    if (symbol.match(/^\$/)) {
      return
    }
    queue.push(symbol);
  }
  while (queue.length) {
    let symbol = queue.shift();
    if (syantanx[symbol]) {
      for (let rule of syantanx[symbol]) {
        if (!state[rule[0]]) {
          queue.push(rule[0])
        }
        let current = state;
        for (let part of rule) {
          if (!current[part]) {
            current[part] = {}
          }
          current = current[part]
        }
        current.$reduceType = symbol;
        current.$reduceLength = rule.length

      }
    }
  }

  for (let symbol in state) {
    if (symbol.match(/^\$/)) {
      return
    }
    if (hash[JSON.stringify(state[symbol])]) {
      state[symbol] = hash[JSON.stringify(state[symbol])]
    } else {
      closure(state[symbol])
    }
  }
  // return start
}

let end = {
  $isEnd: true
}

let start = {
  "Program": end
}

closure(start)

let source = `
 var a;
  `

function parse(source) {
  let stack = [start]
  let symbolStack = [];

  function reduce() {
    let state = stack[stack.length - 1]
    if (state.$reduceType) {
      let children = [];
      for (let i = 0; i < state.$reduceLength; i++) {
        stack.pop()
        children.push(symbolStack.pop())
      }

      return {
        type: state.$reduceType,
        children: children.reverse()
      }
    } else {
      console.log(state)
      throw Error('ddddd')
    }
  }
  function shift(symbol) {
    let state = stack[stack.length - 1]
    if (symbol.type in state) {
      stack.push(state[symbol.type])
      symbolStack.push(symbol)
    } else {
      shift(reduce())
      shift(symbol)
    }
  }
  for (let symbol of scan(source)) {
    console.log(symbol)
    shift(symbol)
  }
  return reduce()
}


let evaluator = {
  Program(node) {
    return evaluator(node.children[0])
  },
  StatementList(node) {
    if (node.children.length === 1) {
      return evaluator(node.children[0])
    } else {
      evaluator(node.children[0])
      return evaluator(node.children[1])
    }
  },
  Statement(node) {
    return evaluator(node.children[0])
  },
  VariableDeclaration(node) {

  },
  EOF() {
    return null
  }
}
function evaluate(node) {
  console.log(node)
  if (evaluator[node.type]) {
    evaluator[node.type](node)
  }
}

let tree = parse(source)
evaluate(tree)