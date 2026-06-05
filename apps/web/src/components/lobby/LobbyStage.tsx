import { Link } from "react-router-dom";

type LobbyStageProps = {
  difficulty: number;
  onDifficulty: () => void;
};

export function LobbyStage({ difficulty, onDifficulty }: LobbyStageProps) {
  return (
    <section className="lobby-stage">
      <div className="stage-character stage-left">상인</div>
      <div className="stage-character stage-boss">거인</div>
      <div className="stage-character stage-right">검사</div>
      <button className="stage-speech" type="button" onClick={onDifficulty}>
        난이도 {difficulty}
      </button>
      <Link className="battle-start" to={`/play?difficulty=${difficulty}`}>
        빠른 시작
      </Link>
    </section>
  );
}
