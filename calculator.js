function Calculator(inputString) {
    this.tokenStream = this.lexer(inputString);
}

Calculator.prototype.lexer = function(string) {
    // create a token stream from the string
    var tokenStream = [];
    var tokenTypes = [
        ['NUMBER',    /^\d+/ ],
        ['ADD',       /^\+/  ],
        ['SUB',       /^\-/  ],
        ['MUL',       /^\*/  ],
        ['DIV',       /^\//  ],
        ['LPAREN',    /^\(/  ],
        ['RPAREN',    /^\)/  ]
    ];

    // loop through each character and check if it matches one of the token types
    for (var i = 0; i < string.length; i++) {
        for (var j = 0; j < tokenTypes.length; j++) {
            if (tokenTypes[j][1].test(string[i])) {
                tokenStream.push({
                    name: tokenTypes[j][0],
                    value: string[i]
                });
            }
        }
    }
    return tokenStream;
        // if it does match one of the token types, push to the token stream
};

Calculator.prototype.peek = function() {
    return this.tokenStream[0] || null;
};

Calculator.prototype.get = function() {
    return this.tokenStream.shift();
};

/* BNF
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

// E = Expression
// T = Term
// F = Factor
// A = ExpressionRemainder // a placeholder created to remove the left-recursion
// B = TermRemainder // same as above

Calculator.prototype.parseExpression = function() {
    var t = this.parseTerm();
    var a = this.parseA();
    return new TreeNode('Expression', t, a);
};

Calculator.prototype.parseTerm = function() {
    var f = this.parseFactor();
    var b = this.parseB();
    return new TreeNode('Term', f, b);
};

Calculator.prototype.parseA = function() {
    var nextToken = this.peek();
    if (nextToken && nextToken.name === 'ADD') {
        this.get();
        return new TreeNode('A', '+', this.parseTerm(), this.parseA());
    } else if (nextToken && nextToken.name === 'SUB') {
        this.get();
        return new TreeNode('A', '-', this.parseTerm(), this.parseA());
    } else {
        return new TreeNode('A');
    }
};

Calculator.prototype.parseB = function() {
    var nextToken = this.peek();
    if (nextToken && nextToken.name === 'MUL') {
        this.get();
        return new TreeNode('B', '*', this.parseFactor(), this.parseB());
    } else if (nextToken && nextToken.name === 'DIV') {
        this.get();
        return new TreeNode('B', '/', this.parseFactor(), this.parseB());
    } else {
        return new TreeNode('B');
    }
};

Calculator.prototype.parseFactor = function() {
    var nextToken = this.peek();

    if (nextToken.name === 'NUMBER' ) {
        var concatNum = nextToken.value;
        this.get();
        while (this.peek() && this.peek().name === 'NUMBER') {
            concatNum += this.get().value;
        }
        return new TreeNode('Factor', concatNum);
    } else if (nextToken.name === 'LPAREN') {
        // tokenStream -> [ "(" , expression, ")" ]
        this.get(); // captures left parens
        var expr = this.parseExpression();
        this.get(); // captures right parens
        return new TreeNode('Factor', '(', expr, ')');
    } else if (nextToken.name === 'SUB') {
        return new TreeNode('Factor', '-', this.parseFactor());
    } else {
        throw new Error('Did not find a factor.');
    }
};

function TreeNode(name, ...children) {
    this.name = name;
    this.children = children;
}
// tree node must accept a visitor;
TreeNode.prototype.accept = function(visitor) {
    return visitor.visit(this);
};

// our visitor object
function InfixVisitor() {
}

InfixVisitor.prototype.visit = function(node) {
    var myselfTheVisitor = this;
    switch(node.name) {
        case "Expression":
            var myString = "";
            // TERM                         // A
            var firstChildOfExp = node.children[0]; // TERM
            var secondChild     = node.children[1]; // A
            var firstChildReturnData = firstChildOfExp.accept(myselfTheVisitor);
            var secondChildReturnData = secondChild.accept(myselfTheVisitor);
            myString += node.children[0].accept(this) + node.children[1].accept(this);
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
                return "(" + node.children[1].accept(this) + ")";

            } else if(node.children[0] === "-") {
                return "-" + node.children[1].accept(this);
            } else {
                // number case
                //console.log(node.children[0])
                return node.children[0];
            }
            break;
    }
}


function InfixVisitorCalc() {
}

InfixVisitorCalc.prototype.visit = function(node) {
    //console.log(node);
    switch (node.name) {
        case 'Expression':
            return node.children[0].accept(this) + node.children[1].accept(this);
            break;
        case 'Term':
            return node.children[0].accept(this) * node.children[1].accept(this);
            break;
        case 'A':
            if (node.children.length > 0) {
                var val = node.children[1].accept(this) + node.children[2].accept(this);
                if (node.children[0] == '+') {
                    return val;
                } else if (node.children[0] == '-') {
                    // need to add logic for subtraction
                    return  -1 * val;
                }
            } else {
                return 0;
            }
            break;
        case 'B':
            if (node.children.length > 0) {
                var val =  node.children[1].accept(this) * node.children[2].accept(this);
                if (node.children[0] == '*') {
                    return val ;
                } else if (node.children[0] == '/') {
                    console.log('hit division');
                    return 1 / val;
                }
            } else {
                // // setting this to 1 breaks addition/subtraction, setting it to 0 can result in ridiculous numbers when dividing
                console.log('******', node);

                return 1;
            }
            break;
        case 'Factor':
            // if first child is open paren
            if (node.children[0] == '(') {
                return node.children[1].accept(this);
            } else if (node.children[0] == '-') {
                // this may need to be changed
                return -1 * node.children[1].accept(this);
            } else {
                return Number(node.children[0]);
            }
            break;
        default:
            console.log('hit default');
            break;
    }
};

// can't multiply or divide
var calc = new Calculator('8*7');
//console.log(calc.tokenStream);
var tree = calc.parseExpression();

//var printOriginalVisitor = new PrintOriginalVisitor();
var infixVisitor = new InfixVisitor();

// infix calc
var infixCalc = new InfixVisitorCalc();
//console.log(tree.accept(infixVisitor));
console.log(tree.accept(infixCalc));

// MAYBE THE 5 NEVER GETS CHECKED

                            //Expression
                 // Term                     //A
               //Factor    //B           //+  //Term //A
              // 5
