function Calculator(inputString) {
    this.tokenStream = this.lexer(inputString);
    this.peekIndex = 0;
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
    if (nextToken && nextToken.name === 'LPAREN') {
        this.get();
        var expr = this.parseExpression();
        this.get();
        return new TreeNode('Factor', '(', expr, ')');
    }  else if (nextToken && nextToken.name === 'SUB') {
        this.get();
        return new TreeNode('Factor', '-', this.parseFactor());
    } else if (nextToken && nextToken.name === 'NUMBER') {
        this.get();
        return new TreeNode('Factor', nextToken.value);
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
function PrintOriginalVisitor() {
    this.visit = function(node) {
        console.log(node);
        switch (node.name) {
            case 'Expression':
                break;
            case 'Term':
                break;
        }
    };
}


function InfixVisitor() {

    this.visit = function(node) {
        //console.log(node);
        switch (node.name) {
            case 'Expression':
                return node.children[0].accept(this) + node.children[1].accept(this);
                break;
            case 'Term':
                return node.children[0].accept(this) + node.children[1].accept(this);
                break;
            case 'A':
                if (node.children.length > 0) {
                    return  node.children[0] + node.children[1].accept(this) + node.children[2].accept(this);
                } else {
                    return '';
                }
                break;
            case 'B':
                if (node.children.length > 0) {
                    return  node.children[0] + node.children[1].accept(this) + node.children[2].accept(this);
                } else {
                    return '';
                }
                break;
            case 'Factor':
                // if first child is open paren
                if (node.children[0] === '(') {
                    return node.children[0].accept(this) + node.children[1].accept(this) + node.children[2].accept(this);
                } else if (node.children[0] === '') {
                    return '-' + node.children(1).accept(this);
                } else {
                    return node.children[0];
                }
                // if first child is -
                // else return child
            default:
                break;
        }
    };
}

function InfixVisitorCalc() {

    this.visit = function(node) {
        //console.log(node);
        switch (node.name) {
            case 'Expression':
                return node.children[0].accept(this) + node.children[1].accept(this);
                break;
            case 'Term':
                console.log('hit term');
                return node.children[0].accept(this) + node.children[1].accept(this);
                break;
            case 'A':
                console.log('hit A');
                if (node.children.length > 0) {
                    if (node.children[0] == '+') {
                        return  node.children[0] + node.children[1].accept(this) + node.children[2].accept(this);
                    } else {
                        return  node.children[0] + node.children[1].accept(this) + node.children[2].accept(this);
                    }
                } else {
                    return '';
                }
                break;
            case 'B':
                if (node.children.length > 0) {
                    return node.children[0] + node.children[1].accept(this) + node.children[2].accept(this);
                } else {
                    //console.log('not')
                    return '';
                }
                break;
            case 'Factor':
                // if first child is open paren
                if (node.children[0] === '(') {
                    return node.children[1].accept(this);
                } else if (node.children[0] === '-') {
                    // this may need to be changed
                    return '-' + node.children(1).accept(this);
                } else {
                    return node.children[0];
                }
                // if first child is -
                // else return child
            default:
                break;
        }
    };
}



var calc = new Calculator('(4+3)/4*3');
var tree = calc.parseExpression();

var printOriginalVisitor = new PrintOriginalVisitor();
var infixVisitor = new InfixVisitor();

// infix calc
var infixCalc = new InfixVisitorCalc();
console.log(tree.accept(infixCalc));


// best way to traverse parse tree inorder dfs
