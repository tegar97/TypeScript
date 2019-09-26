/* @internal */
namespace ts {
    export function createNodeConverters(factory: NodeFactory): NodeConverters {
        return {
            convertToFunctionBlock,
            convertToFunctionExpression,
            convertToArrayAssignmentElement,
            convertToObjectAssignmentElement,
            convertToAssignmentPattern,
            convertToObjectAssignmentPattern,
            convertToArrayAssignmentPattern,
            convertToAssignmentElementTarget,
        };

        function convertToFunctionBlock(node: ConciseBody, multiLine?: boolean): Block {
            if (isBlock(node)) return node;
            const returnStatement = factory.createReturn(node);
            setTextRange(returnStatement, node);
            const body = factory.createBlock([returnStatement], multiLine);
            setTextRange(body, node);
            return body;
        }

        function convertToFunctionExpression(node: FunctionDeclaration) {
            if (!node.body) return Debug.fail(`Cannot convert a FunctionDeclaration without a body`);
            const updated = factory.createFunctionExpression(
                node.modifiers,
                node.asteriskToken,
                node.name,
                node.typeParameters,
                node.parameters,
                node.type,
                node.body
            );
            setOriginalNode(updated, node);
            setTextRange(updated, node);
            if (getStartsOnNewLine(node)) {
                setStartsOnNewLine(updated, /*newLine*/ true);
            }
            return updated;
        }

        function convertToArrayAssignmentElement(element: ArrayBindingOrAssignmentElement) {
            if (isBindingElement(element)) {
                if (element.dotDotDotToken) {
                    Debug.assertNode(element.name, isIdentifier);
                    return setOriginalNode(setTextRange(factory.createSpread(<Identifier>element.name), element), element);
                }
                const expression = convertToAssignmentElementTarget(element.name);
                return element.initializer
                    ? setOriginalNode(
                        setTextRange(
                            factory.createAssignment(expression, element.initializer),
                            element
                        ),
                        element
                    )
                    : expression;
            }
            return cast(element, isExpression);
        }

        function convertToObjectAssignmentElement(element: ObjectBindingOrAssignmentElement) {
            if (isBindingElement(element)) {
                if (element.dotDotDotToken) {
                    Debug.assertNode(element.name, isIdentifier);
                    return setOriginalNode(setTextRange(factory.createSpreadAssignment(<Identifier>element.name), element), element);
                }
                if (element.propertyName) {
                    const expression = convertToAssignmentElementTarget(element.name);
                    return setOriginalNode(setTextRange(factory.createPropertyAssignment(element.propertyName, element.initializer ? factory.createAssignment(expression, element.initializer) : expression), element), element);
                }
                Debug.assertNode(element.name, isIdentifier);
                return setOriginalNode(setTextRange(factory.createShorthandPropertyAssignment(<Identifier>element.name, element.initializer), element), element);
            }

            return cast(element, isObjectLiteralElementLike);
        }

        function convertToAssignmentPattern(node: BindingOrAssignmentPattern): AssignmentPattern {
            switch (node.kind) {
                case SyntaxKind.ArrayBindingPattern:
                case SyntaxKind.ArrayLiteralExpression:
                    return convertToArrayAssignmentPattern(node);

                case SyntaxKind.ObjectBindingPattern:
                case SyntaxKind.ObjectLiteralExpression:
                    return convertToObjectAssignmentPattern(node);
            }
        }

        function convertToObjectAssignmentPattern(node: ObjectBindingOrAssignmentPattern) {
            if (isObjectBindingPattern(node)) {
                return setOriginalNode(
                    setTextRange(
                        factory.createObjectLiteral(map(node.elements, convertToObjectAssignmentElement)),
                        node
                    ),
                    node
                );
            }
            return cast(node, isObjectLiteralExpression);
        }

        function convertToArrayAssignmentPattern(node: ArrayBindingOrAssignmentPattern) {
            if (isArrayBindingPattern(node)) {
                return setOriginalNode(
                    setTextRange(
                        factory.createArrayLiteral(map(node.elements, convertToArrayAssignmentElement)),
                        node
                    ),
                    node
                );
            }
            return cast(node, isArrayLiteralExpression);
        }

        function convertToAssignmentElementTarget(node: BindingOrAssignmentElementTarget): Expression {
            if (isBindingPattern(node)) {
                return convertToAssignmentPattern(node);
            }

            return cast(node, isExpression);
        }
    }

    export const nullNodeConverters: NodeConverters = {
        convertToFunctionBlock: notImplemented,
        convertToFunctionExpression: notImplemented,
        convertToArrayAssignmentElement: notImplemented,
        convertToObjectAssignmentElement: notImplemented,
        convertToAssignmentPattern: notImplemented,
        convertToObjectAssignmentPattern: notImplemented,
        convertToArrayAssignmentPattern: notImplemented,
        convertToAssignmentElementTarget: notImplemented,
    };
}