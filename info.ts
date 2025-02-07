export type Pos = {
    index: number;
    line: number;
    col: number;
};

export class Reporter {
    public constructor(
        private filePath: string,
        private text: string,
    ) {}

    public error(msg: string, pos?: Pos) {
        console.log(
            `%cerror: %c${msg}`,
            colors.error,
            colors.emphasis,
        );
        if (!pos) {
            return;
        }
        const lineText = this.text.slice(
            this.text.lastIndexOf("\n", pos.index) + 1,
            this.text.indexOf("\n", pos.index),
        );

        const nr = (1).toString();
        const nrPad = " ".repeat(nr.length + 1);
        const colPad = " ".repeat(pos.col - 1);

        console.log(
            `${nrPad}%c--> %c${this.filePath}:${pos.line}:${pos.col}`,
            colors.info,
            colors.text,
        );

        console.log(
            `%c${nrPad} |`,
            colors.info,
        );

        console.log(
            ` %c${nr} |%c${lineText}`,
            colors.info,
            colors.text,
        );
        console.log(
            `%c${nrPad} |${colPad}%c^`,
            colors.info,
            colors.error,
        );
        throw new Error();
    }
}

const colors = {
    text: "",
    info: "color: blue",
    emphasis: "font-weight: bold",
    error: "color: red; font-weight: bold;",
};
