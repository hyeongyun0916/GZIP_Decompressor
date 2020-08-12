'use strict';

['debug', 'log', 'warn', 'error'].forEach((methodName) => {
    const originalLoggingMethod = console[methodName];
    console[methodName] = (firstArgument, ...otherArguments) => {
        const originalPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = (_, stack) => stack;
        const callee = new Error().stack[1];
        Error.prepareStackTrace = originalPrepareStackTrace;
        // const relativeFileName = path.relative(process.cwd(), callee.getFileName());
        // @ts-ignore
        const prefix = `${callee.getFileName()}:${callee.getLineNumber()}:${callee.getFunctionName()}:\n`;
        if (typeof firstArgument === 'string') {
            originalLoggingMethod(prefix + ' ' + firstArgument, ...otherArguments);
        } else {
            originalLoggingMethod(prefix, firstArgument, ...otherArguments);
        }
    };
});