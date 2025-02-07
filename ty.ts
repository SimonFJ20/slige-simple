export type Ty = {
    kind: TyKind;
};

export type TyKind =
    | { tag: "error" }
    | { tag: "unit" };

export class TyCx {
    private tys: Ty[] = [];

    public ty(kind: TyKind): Ty {
        const cand: Ty = { kind };
        const idx = this.tys
            .findIndex((ty) => tyEqual(cand, ty));
        if (idx === -1) {
            this.tys.push(cand);
            return cand;
        }
        return this.tys[idx];
    }
}

export function tyEqual(a: Ty, b: Ty): boolean {
    const ak = a.kind;
    const bk = b.kind;
    if (ak.tag !== bk.tag) {
        return false;
    }
    switch (a.kind.tag) {
        case "error":
            return bk.tag === "error";
        case "unit":
            return bk.tag === "unit";
    }
    const _: never = a.kind;
}
