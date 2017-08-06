

function Calculator(inputString) {
  this.tokenStream = this.lexer(inputString);
};


Calculator.prototype.lexer = function(inputString) {
  var tokenTypes = [
    ["NUMBER",    /^\d+/ ],
    ["ADD",       /^\+/  ],
    ["SUB",       /^\-/  ],
    ["MUL",       /^\*/  ],
    ["DIV",       /^\//  ],
    ["LPAREN",    /^\(/  ],
    ["RPAREN",    /^\)/  ]
  ];


  var tokens = [];
  var matched = true;

  while(inputString.length > 0 && matched) {
    matched = false;

    tokenTypes.forEach(tokenRegex => {
      var token = tokenRegex[0];
      var regex = tokenRegex[1];

      var result = regex.exec(inputString);

      if(result !== null) {
        matched = true;    
        tokens.push({name: token, value: result[0]});
        inputString = inputString.slice(result[0].length)
      }
    })

    if(!matched) {
      throw new Error("Found unparseable token: " + inputString);
    }

  }

  return tokens;

}


// idempotent => this function is non-destructive
Calculator.prototype.peek = function() {
  return this.tokenStream[0] || null;
}

// T1 T2 T3
// T2 T3
Calculator.prototype.get = function() {
  return this.tokenStream.shift();
}


function TreeNode(name, ...children) {
  this.name = name;
  this.children = children;  
}

// var myHtml = "<div><h1>Hello</h1></div>";
// "1+2+4*3"
/* 

E => T A
A => + T A
     - T A
     epsilon
T => F B
B => * F B
     / F B
     epsilon
F => ( E )
     - F
     NUMBER
     */

Calculator.prototype.parseExpression = function() {
  var term = this.parseTerm();
  var a = this.parseA();

  return new TreeNode("Expression", term, a);
  // treeNode.children = [term, a]
}

Calculator.prototype.parseTerm = function() {
  var factor = this.parseFactor();
  var b = this.parseB();

  return new TreeNode("Term", factor, b);
  // treeNode.children = [term, a]
}

Calculator.prototype.parseA = function() {
  var nextToken = this.peek();
  if(nextToken && nextToken.name === "ADD") {
    this.get();
    return new TreeNode("A", "+", this.parseTerm(), this.parseA());
  } else if(nextToken && nextToken.name === "SUB") {
    this.get();
    return new TreeNode("A", "-", this.parseTerm(), this.parseA());
  } else {
    return new TreeNode("A");
  }
}


/* B -> 
      * F B
      / F B
      eps */
Calculator.prototype.parseB = function() {
  var nextToken = this.peek();
  if(nextToken && nextToken.name === "MUL") {
    this.get();
    return new TreeNode("B", "*", this.parseFactor(), this.parseB());
  } else if(nextToken && nextToken.name === "DIV") {
    this.get();
    return new TreeNode("B", "/", this.parseFactor(), this.parseB());
  } else {
    return new TreeNode("B");
  }
}

// parseFactor
/*
F => ( E )
     - F
     NUMBER
     */
// 3*-((4+1))
// F -> -F -> -(E)
Calculator.prototype.parseFactor = function() {
  var nextToken = this.peek();

  if(nextToken.name === "NUMBER" ) {
    return new TreeNode("Factor", this.get().value);
  } else if (nextToken.name === "LPAREN") {
    // tokenStream -> [ "(" , expression, ")" ]
    this.get(); // captures left parens
    var expr = this.parseExpression();
    this.get(); // captures right parens
    return new TreeNode("Factor", "(", expr, ")");  
  } else if (nextToken.name === "SUB") {
    return new TreeNode("Factor", "-", this.parseFactor());
  } else {
    throw new Error("Did not find a factor.");
  }
}

TreeNode.prototype.accept = function(visitor) {
  return visitor.visit(this);
}

function PrintOriginalVisitor() {
}

PrintOriginalVisitor.prototype.visit = function(node) {
  var myselfTheVisitor = this;
  switch(node.name) {
    case "Expression":
      var myString = "";
              // TERM                         // A
      var firstChildOfExp = node.children[0]; // TERM
      var secondChild     = node.children[1]; // A
      var firstChildReturnData = firstChildOfExp.accept(myselfTheVisitor);
      var secondChildReturnData = secondChild.accept(myselfTheVisitor);
      // myString += node.children[0].accept(this) + node.children[1].accept(this);
      return myString;
      break;
    case "Term":
              // FACTOR                         // B
      return node.children[0].accept(this) + node.children[1].accept(this);
      break;
    case "A":
      if(node.children.length > 0) {
        return node.children[0] /* + or - */ + node.children[1].accept(this) + node.children[2].accept(this);
      } else { // epsilon
        return "";
      }
      break;
    case "B":
      if(node.children.length > 0) {
        return node.children[0] /* + or - */ + node.children[1].accept(this) + node.children[2].accept(this);
      } else { // epsilon
        return "";
      }
      break;
    case "Factor":
      if(node.children[0] === "(") {
        // return "(" + node.children[1].accept(this) + ")";
        return node.children[1].accept(this);
        
      } else if(node.children[0] === "-") {
        return "-" + node.children[1].accept(this);
      } else {
        // number case
        return node.children[0];
      }
      break;
  }
}

function RPNVisitor() {
}

RPNVisitor.prototype.tion(node) {
  var myselfTheVisitor = this;
  switch(node.name) {
    case "Expression":
      // T A

      return node.children[0].accept(this) + " " + node.children[1].accept(this);      
      break;
    case "Term":
              // FACTOR                         // B
      return node.children[0].accept(this) + " " + node.children[1].accept(this);
      break;
    case "A": // +/- T A -> TA+/-

      // A -> + T A
      // A -> eps
      // E -> E + E + E + E
      // E -> TA -> T+TA -> T+TT+ 1+2+3+4 1234++ 4321++
      if(node.children.length > 0) {
        // + 4 + 5
        // 5 + 4 +
        return node.children[1].accept(this) + " " + node.children[2].accept(this) + " " + node.children[0];
      } else { // epsilon
        return "";
      }
      break;
    case "B":
      if(node.children.length > 0) {
        return node.children[1].accept(this) + " " + node.children[2].accept(this) + " " + node.children[0];
      } else { // epsilon
        return "";
      }
      break;
    case "Factor":
      if(node.children[0] === "(") {
        return node.children[1].accept(this);
      } else if(node.children[0] === "-") {
        return "-" + node.children[1].accept(this);
      } else {
        // number case
        return node.children[0];
      }
      break;
  }
}

function CalcVisitor() {

}

CalcVisitor.prototype.visit = function(node) {
  var myselfTheVisitor = this;
  switch(node.name) {
    case "Expression":
      // E -> TA
      var t = node.children[0].accept(this);
      var a = node.children[1].accept(this);
      return t+a;
      break;
    case "Term":
      var f = node.children[0].accept(this);
      var b = node.children[1].accept(this);
      return f*b;
      break;
    case "A":
      // A -> + T A
      if(node.children.length > 0) {
        var val = node.children[1].accept(this) + node.children[2].accept(this);
        if(node.children[0] === "+") {
          return val;
        } else if(node.children[0] === "-") {
          return -1 * val;
        }
      } else {
        // epsilon
        return 0;
      }

      callExpensiveFunction();
      break;
    case "B":
          // A -> + T A
      if(node.children.length > 0) {
        var val = node.children[1].accept(this) * node.children[2].accept(this);
        if(node.children[0] === "*") {
          return val;
        } else if(node.children[0] === "/") {
          return 1/val;
        }
      } else {
        // epsilon
        return 1;
      }
      break;
     break;
    case "Factor":
      if(node.children[0] ==="(") {
        return node.children[1].accept(this); // expressionv alue
      } else if(node.children[0] === "-" ) {
        return -1 * node.children[1].accept(this);
      } else {
        return Number(node.children[0]);
      }

     break;
  }  
}


// 35+62132*+++*3+
var calc = new Calculator("3+5*(6+2+(3*2)+1)+3"); // 81
var parseTree = calc.parseExpression();
// debugger;
// console.log(calc.tokenStream);

// var printVisitor = new PrintOriginalVisitor();
// var out = parseTree.accept(printVisitor);
var rpnVisitor = new RPNVisitor();
var out = parseTree.accept(rpnVisitor);

var calcVisitor = new CalcVisitor();
out = parseTree.accept(calcVisitor);

console.log("out", out);