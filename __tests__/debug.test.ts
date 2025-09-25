// Teste simples para debug
describe('Debug Test', () => {
  it('should run a simple test', () => {
    expect(1 + 1).toEqual(2)
  })

  it('should test setImmediate availability', () => {
    // Verificar se setImmediate está disponível
    console.log('setImmediate available:', typeof setImmediate !== 'undefined')
    console.log('global.setImmediate available:', typeof global.setImmediate !== 'undefined')
    
    expect(true).toBe(true)
  })
})