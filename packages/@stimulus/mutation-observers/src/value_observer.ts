import { Token, TokenObserver, TokenObserverDelegate } from "./token_observer"

export interface ValueObserverDelegate<T> {
  parseValueForToken(token: Token): T | undefined
  elementMatchedValue(element: Element, value: T)
  elementUnmatchedValue(element: Element, value: T)
}

interface ParseResult<T> {
  value?: T
  error?: Error
}

export class ValueObserver<T> implements TokenObserverDelegate {
  private tokenObserver: TokenObserver
  private delegate: ValueObserverDelegate<T>
  private parseResultsByToken: WeakMap<Token, ParseResult<T>>
  private valuesByTokenByElement: WeakMap<Element, Map<Token, T>>

  constructor(element: Element, attributeName: string, delegate: ValueObserverDelegate<T>) {
    this.tokenObserver = new TokenObserver(element, attributeName, this)
    this.delegate = delegate
    this.parseResultsByToken = new WeakMap
    this.valuesByTokenByElement = new WeakMap
  }

  get started(): boolean {
    return this.tokenObserver.started
  }

  start() {
    this.tokenObserver.start()
  }

  stop() {
    this.tokenObserver.stop()
  }

  refresh() {
    this.tokenObserver.refresh()
  }

  get element(): Element {
    return this.tokenObserver.element
  }

  get attributeName(): string {
    return this.tokenObserver.attributeName
  }

  tokenMatched(token: Token) {
    const { element } = token
    const { value } = this.fetchParseResultForToken(token)
    if (value) {
      this.fetchValuesByTokenForElement(element).set(token, value)
      this.delegate.elementMatchedValue(element, value)
    }
  }

  tokenUnmatched(token: Token) {
    const { element } = token
    const { value } = this.fetchParseResultForToken(token)
    if (value) {
      this.fetchValuesByTokenForElement(element).delete(token)
      this.delegate.elementUnmatchedValue(element, value)
    }
  }

  private fetchParseResultForToken(token: Token) {
    let parseResult = this.parseResultsByToken.get(token)
    if (!parseResult) {
      parseResult = this.parseToken(token)
      this.parseResultsByToken.set(token, parseResult)
    }
    return parseResult
  }

  private fetchValuesByTokenForElement(element: Element) {
    let valuesByToken = this.valuesByTokenByElement.get(element)
    if (!valuesByToken) {
      valuesByToken = new Map
      this.valuesByTokenByElement.set(element, valuesByToken)
    }
    return valuesByToken
  }

  private parseToken(token: Token): ParseResult<T> {
    try {
      const value = this.delegate.parseValueForToken(token)
      return { value }
    } catch (error) {
      return { error }
    }
  }
}
