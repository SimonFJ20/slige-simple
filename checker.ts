import { Reporter } from "./info.ts";
import { Resols } from "./resolver.ts";
import { Ty, TyCx, TyKind } from "./ty.ts";
import * as ast from "./ast.ts";

export class Checker {
    private stmtTys = new Map<number, Ty>();
    private exprTys = new Map<number, Ty>();
    private tyTys = new Map<number, Ty>();

    public constructor(
        private cx: TyCx,
        private re: Resols,
        private rep: Reporter,
    ) {}

    public expr(expr: ast.Expr): Ty {
        return this.exprTys.get(expr.id) || this.checkExpr(expr);
    }

    private checkExpr(expr: ast.Expr): Ty {
        const k = expr.kind;
        switch (k.tag) {
            case "error":
                return this.errorTy();
            case "ident":
            case "unit":
            case "int":
            case "bool":
            case "str":
            case "tuple":
            case "repeat":
            case "array":
            case "elem":
            case "index":
            case "call":
            case "unary":
            case "binary":
                throw new Error();
        }
        const _: never = k;
    }

    private errorTy(): Ty {
        return this.make({ tag: "error" });
    }

    private make(kind: TyKind): Ty {
        return this.cx.ty(kind);
    }
}
