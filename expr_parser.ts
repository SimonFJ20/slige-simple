import { BinaryOp, Expr, UnaryOp } from "./ast.ts";
import { ParserBase } from "./parser_base.ts";

export abstract class ExprParser extends ParserBase {
    public override parseExpr(): Expr {
        return this.parseBinary();
    }

    private parseBinary(minBp = 0): Expr {
        const pos = this.pos();
        let left = this.parseUnary();
        while (!this.done()) {
            const op = this.current().type as BinaryOp;
            if (!(op in binaryOpBindPowers)) {
                break;
            }
            const [lbp, rbp] = binaryOpBindPowers[op];
            if (lbp < minBp) {
                break;
            }
            this.step();
            const right = this.parseBinary(rbp);
            left = this.expr({ tag: "binary", left, right, op }, pos);
        }
        return left;
    }

    private parseUnary(): Expr {
        const pos = this.pos();
        if (this.test("not") || this.test("-")) {
            const op = this.current().type as UnaryOp;
            this.step();
            const expr = this.parsePostfix();
            return this.expr({ tag: "unary", expr, op }, pos);
        } else {
            return this.parsePostfix();
        }
    }

    private parsePostfix(): Expr {
        const pos = this.pos();
        let expr = this.parseOp();
        while (true) {
            if (this.eat(".")) {
                if (this.test("int")) {
                    const elem = this.current().intVal!;
                    this.step();
                    expr = this.expr({ tag: "elem", expr, elem }, pos);
                } else {
                    this.rep.error("expected element or field", this.pos());
                    return this.errorExpr(pos);
                }
            } else if (this.eat("[")) {
                const idx = this.parseExpr();
                if (!this.eatOrReport("]")) {
                    return this.errorExpr(pos);
                }
                return this.expr({ tag: "index", expr, idx }, pos);
            } else if (this.eat("(")) {
                const args: Expr[] = [];
                if (!this.done() && !this.test(")")) {
                    args.push(this.parseExpr());
                    while (!this.done() && !this.test(")")) {
                        if (!this.eatOrReport(",")) {
                            return this.errorExpr(pos);
                        }
                        if (this.test(")")) {
                            break;
                        }
                        args.push(this.parseExpr());
                    }
                }
                if (!this.eatOrReport(")")) {
                    return this.errorExpr(pos);
                }
                return this.expr({ tag: "call", expr, args }, pos);
            } else {
                return expr;
            }
        }
    }

    private parseOp(): Expr {
        const pos = this.pos();
        if (this.test("ident")) {
            const ident = this.current().identVal!;
            this.step();
            switch (ident) {
                case "false":
                    return this.expr({ tag: "bool", val: false }, pos);
                case "true":
                    return this.expr({ tag: "bool", val: true }, pos);
                default:
                    return this.expr({ tag: "ident", ident }, pos);
            }
        } else if (this.test("int")) {
            const val = this.current().intVal!;
            this.step();
            return this.expr({ tag: "int", val }, pos);
        } else if (this.test("str")) {
            const val = this.current().strVal!;
            this.step();
            return this.expr({ tag: "str", val }, pos);
        } else if (this.test("(")) {
            this.step();
            if (this.eat(")")) {
                return this.expr({ tag: "unit" }, pos);
            }
            const expr = this.parseExpr();
            if (this.eat(")")) {
                return expr;
            }
            const exprs = [expr];
            while (!this.done() && !this.test(")")) {
                if (!this.eatOrReport(",")) {
                    return this.errorExpr(pos);
                }
                if (this.test(")")) {
                    break;
                }
                exprs.push(this.parseExpr());
            }
            if (!this.eatOrReport(")")) {
                return this.errorExpr(pos);
            }
            return this.expr({ tag: "tuple", exprs }, pos);
        } else if (this.test("[")) {
            this.step();
            const expr = this.parseExpr();
            if (this.eat(";")) {
                const len = this.parseExpr();

                if (!this.eatOrReport("]")) {
                    return this.errorExpr(pos);
                }
                return this.expr({ tag: "repeat", expr, len }, pos);
            }
            const exprs = [expr];
            while (!this.done() && !this.test("]")) {
                if (!this.eatOrReport(",")) {
                    return this.errorExpr(pos);
                }
                if (this.test("]")) {
                    break;
                }
                exprs.push(this.parseExpr());
            }
            if (!this.eatOrReport("]")) {
                return this.errorExpr(pos);
            }
            return this.expr({ tag: "tuple", exprs }, pos);
        } else {
            this.rep.error("expected expression", pos);
            this.step();
            return this.errorExpr(pos);
        }
    }
}

const binaryOpBindPowers: Record<string, [number, number]> = {
    "or": [1, 2],
    "and": [1, 2],
    "==": [3, 4],
    "!=": [3, 4],
    "<": [5, 6],
    ">": [5, 6],
    "+": [7, 8],
    "-": [7, 8],
    "*": [9, 10],
    "/": [9, 10],
};
