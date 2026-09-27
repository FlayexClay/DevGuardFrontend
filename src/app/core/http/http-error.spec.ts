import { describeHttpError } from './http-error';

describe('describeHttpError', () => {
  it('usa el detail del ProblemDetail cuando existe', () => {
    expect(describeHttpError({ status: 409, error: { detail: 'Slug repetido' } })).toBe(
      'Slug repetido',
    );
  });

  it('traduce los estados conocidos', () => {
    expect(describeHttpError({ status: 403 })).toBe('No tienes permisos para esta operación');
    expect(describeHttpError({ status: 404 })).toBe('No encontrado');
  });

  it('da un mensaje generico para cualquier otro error', () => {
    expect(describeHttpError(null)).toBe('No se pudo completar la operación');
    expect(describeHttpError({ status: 500 })).toBe('No se pudo completar la operación');
  });
});
