import { Ty } from "./ast.ts";
import { ParserBase } from "./parser_base.ts";

export abstract class TyParser extends ParserBase {
    public override parseTy(): Ty {
        const pos = this.pos();
        if (this.test("ident")) {
            const ident = this.current().identVal!;
            this.step();
            switch (ident) {
                case "int":
                    return this.ty({ tag: "int" }, pos);
                case "bool":
                    return this.ty({ tag: "bool" }, pos);
                case "str":
                    return this.ty({ tag: "str" }, pos);
                default:
                    return this.ty({ tag: "ident", ident }, pos);
            }
        } else if (this.test("(")) {
            this.step();
            const tys: Ty[] = [];
            if (!this.done() && !this.test(")")) {
                tys.push(this.parseTy());
                while (!this.done() && !this.test(")")) {
                    if (!this.eatOrReport(",")) {
                        return this.errorTy(pos);
                    }
                    if (this.test(")")) {
                        break;
                    }
                    tys.push(this.parseTy());
                }
            }
            if (!this.eatOrReport(")")) {
                return this.errorTy(pos);
            }
            if (tys.length === 0) {
                return this.ty({ tag: "unit" }, pos);
            } else {
                return this.ty({ tag: "tuple", tys }, pos);
            }
        } else if (this.test("[")) {
            this.step();
            const ty = this.parseTy();
            if (this.test("]")) {
                this.step();
                return this.ty({ tag: "slice", ty }, pos);
            }
            if (!this.eatOrReport(";")) {
                return this.errorTy(pos);
            }
            const len = this.parseExpr();
            if (!this.eatOrReport("]")) {
                return this.errorTy(pos);
            }
            return this.ty({ tag: "array", ty, len }, pos);
        } else {
            this.rep.error("expected type", pos);
            return this.errorTy(pos);
        }
    }
}
