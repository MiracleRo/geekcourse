

class XRegExp {

  constructor(source, flag, root = 'root') {
    this.table = new Map();

    this.regexp = new RegExp(this.compileRegExp(source, root, 0).source, flag)
  }

  compileRegExp(source, name, start) {
    if (source[name] instanceof RegExp)
      return { source: source[name].source, length: 0 }
    let length = 0;
    let regexp = source[name].replace(/\<([^>]+)\>/g, (str, $1) => {
      this.table.set(start + length, $1);
      this.table.set($1, start + length);
      ++length;
      let r = this.compileRegExp(source, $1, start + length);

      length += r.length;
      return '(' + r.source + ')'
    });

    return {
      source: regexp,
      length: length
    }
  }
  exec(string) {
    let r = this.regexp.exec(string)
    for (let i = 1; i < r.length; i++) {
      if (r[i] !== void 0) {

        r[this.table.get(i - 1)] = r[i]
      }
    }

    return r
  }

  get lastIndex() {
    return this.regexp.lastIndex;
  }

  set lastIndex(value) {
    return this.regexp.lastIndex = value
  }
}
let xregexp = {
  InputElement: "<WhiteSpace>|<LineTerminator>|<Comments>|<Token>",
  WhiteSpace: / /,
  LineTerminator: /\n/,
  Comments: /\/\*(?:[^*]|\*[^\/])*\*\/|\/\/[^\n]*/,
  Token: "<Literal>|<KeyWords>|<Indentifier>|<Punctuator>",
  Literal: "<NumbericLiteral>|<BooleanLiteral>|<StringLiteral>|<NullLiteral>",
  NumbericLiteral: /(?:[1-9][0-9]*|0|)\.[0-9]*|\.[0-9]+/,
  BooleanLiteral: /true|false/,
  StringLiteral: /\"(?:[^"\n]|\\[\s\S])*\"|\'(?:[^'\n]|\\[\s\S])*\'/,
  NullLiteral: /null/,
  Indentifier: /[a-zA-Z_$][a-zA-Z0-9_$]*/,
  KeyWords: /if|eles|for|function|let|const|var/,
  Punctuator: /\+|\,|\?|\{|\}|\.|\(|\=|\<|\+\+|\=\=|\=\>|\*|\)|\[|\]|\;/
}

export function* scan(str) {
  let regexp = new XRegExp(xregexp, "g", "InputElement");
  while (regexp.lastIndex < str.length) {
    let r = regexp.exec(str);
    // yield r;
    if (r.WhiteSpace) {

    } else if (r.Comments) {

    } else if (r.LineTerminator) {

    } else if (r.NumbericLiteral) {
      yield {
        type: 'NumbericLiteral',
        value: r[0]
      }
    } else if (r.StringLiteral) {
      yield {
        type: 'StringLiteral',
        value: r[0]
      }
    } else if (r.BooleanLiteral) {
      yield {
        type: 'BooleanLiteral',
        value: r[0]
      }
    } else if (r.NullLiteral) {
      yield {
        type: 'NullLiteral',
        value: null
      }
    } else if (r.Indentifier) {
      yield {
        type: 'Indentifier',
        name: r[0]
      }
    } else if (r.KeyWords) {
      yield {
        type: r[0]
      }
    } else if (r.Punctuator) {
      yield {
        type: r[0]
      }
    } else {
      console.log(r)
      throw new Error("")
    }
    if (!r[0].length) break;
  }
  yield {
    type: "EOF"
  }
}
function compileRegExp(xregexp, name) {
  if (xregexp[name] instanceof RegExp)
    return xregexp[name].source

  let regexp = xregexp[name].replace(/\<([^>]+)\>/g, function (str, $1) {
    return compileRegExp(xregexp, $1)
  });

  return regexp;
}

