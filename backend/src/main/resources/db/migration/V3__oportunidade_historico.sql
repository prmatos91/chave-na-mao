CREATE TABLE oportunidade_historico (
    id                BIGSERIAL PRIMARY KEY,
    oportunidade_id   BIGINT      NOT NULL REFERENCES oportunidade (id) ON DELETE CASCADE,
    status_anterior   VARCHAR(30),
    status_novo       VARCHAR(30) NOT NULL,
    alterado_em       TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX idx_oportunidade_historico_oportunidade ON oportunidade_historico (oportunidade_id, alterado_em);

-- Registra o status inicial de cada oportunidade ja existente no seed (V2), para a
-- timeline nao nascer vazia na primeira execucao.
INSERT INTO oportunidade_historico (oportunidade_id, status_anterior, status_novo)
SELECT id, NULL, status FROM oportunidade;

