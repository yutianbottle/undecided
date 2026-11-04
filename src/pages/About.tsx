import { Shell, Foot } from '../components/Shell';
import { useLang } from '../i18n';
import { Section } from '../components/ui';
import { REFERENCES, PRACTICE_ONLY } from '../knowledge/references';
import { GATES, gateName, layerName } from '../knowledge/gates';

const KIND_LABEL: Record<string, { zh: string; en: string }> = {
  paper: { zh: '论文', en: 'Paper' },
  book: { zh: '书', en: 'Book' },
  report: { zh: '报告', en: 'Report' },
  practice: { zh: '实践', en: 'Practice' },
};

export default function About() {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  return (
    <Shell>
      <div className="wrap">
        <a className="btn btn--text" href="#/" style={{ paddingLeft: 0 }}>{L('← 台面', '← Desk')}</a>

        <h1 className="h1" style={{ marginTop: 'var(--sp3)' }}>{L('关于', 'About')}</h1>

        <Section title={L('这是什么', 'What this is')}>
          <p className="card-d">
            {L('未决是给', 'Undecided is for people who ')}<b style={{ color: 'var(--paper)', fontWeight: 400 }}>{L('要自己拍板的人', 'have to make the call themselves')}</b>{L('用的。', '.')}
            {L('它不假设你缺建议——今天建议太便宜了。它假设你缺的是：把通用答案放回自己的处境里掂一遍，认出这类决定常踩的坑，然后留下一个到期能对账的判断。', ' It does not assume you lack advice — advice is cheap now. It assumes what you lack is this: putting the general answer back into your own situation, recognising the trap this kind of decision usually sets, and leaving a judgement you will have to answer for on the due date.')}
          </p>
          <p className="card-d" style={{ marginTop: 12 }}>
            {L('它不接 AI，不给你建议，不评分，不排名。', 'No AI, no advice, no scoring, no ranking.')}
            {L('它只做三件事：让悬着的东西显形、把该知道的东西递到眼前、到期后再次打开网站时，让你回看预测与结果。它只照亮，不替你走。', ' It does three things: make what is hanging visible, put what you should know in front of you, and bring you back to your prediction when it is due. It lights the desk; it does not walk the step for you.')}
          </p>
        </Section>

        <Section title={L('和去问 AI 有什么不同', 'How this differs from asking an AI')}>
          <p className="card-d">
            {L('你去问 AI，它会给你一套正确的、通用的、放在谁身上都成立的说法。', 'Ask an AI and you get an answer that is correct, generic, and true of anyone.')}
            {L('那些话没错，但它不知道你的客户拖过你 45 天款，不知道你上次报低价之后对方反而更不信任你。', ' Nothing wrong with it — but it does not know that this client paid you 45 days late, or that quoting low last time made them trust you less.')}
          </p>
          <p className="card-d" style={{ marginTop: 12 }}>
            {L('这个工具反过来：它先承认 AI 会说什么，再问你——', 'This tool does the reverse: it states what an AI would say, then asks you — ')}<b style={{ color: 'var(--paper)', fontWeight: 400 }}>{L('哪一条对你不适用，为什么。', 'which one does not apply to you, and why.')}</b>
            {L('你说出来的那句“为什么”，才是这个决定真正的变量。', ' That “why” is the real variable in the decision.')}
          </p>
        </Section>

        <Section title={L('它怎么运作', 'How it works')}>
          <p className="card-d" style={{ marginBottom: 14 }}>
            {L('八类决定被放在一张图上：横轴是“做错了还能不能改”，纵轴是“多久知道结果”。', 'Eight kinds of decision on one map: the axis across is whether it can be undone, the axis up is how long until you know.')}
            {L('越靠右上，越值得花时间；越靠左下，越该现在就做。', ' Top right deserves time. Bottom left should be done now.')}
          </p>
          <div className="caselist" style={{ marginTop: 0 }}>
            {GATES.map((g) => (
              <div key={g.id} className="caserow" style={{ cursor: 'default' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="caselow-q" style={{ fontSize: 'var(--fs-body)' }}>{gateName(g.id, lang)}</div>
                  <div className="caselow-meta">
                    <span className="gate-tag">
                      {L(g.reversibility <= 2 ? '做错了能改回来' : g.reversibility === 3 ? '改起来有代价' : '基本改不回来', g.reversibility <= 2 ? 'reversible' : g.reversibility === 3 ? 'costly to undo' : 'hard to undo')}
                    </span>
                    <span className="gate-tag">{L(`约 ${g.feedbackDays} 天知道结果`, `~${g.feedbackDays}d to know`)}</span>
                  </div>
                </div>
                <div className="days">{layerName(g.layer, lang)}</div>
              </div>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 16 }}>
            {L('每个决定走七步：摆选项 → 写事实 → 换人称自问 → 看照明 → 落槌 → 封存 → 到期开封。', 'Seven steps: options → facts → third-person question → the light → the call → seal → reopen when due. ')}
            {L('落槌前有八秒静止，封存后不可修改。', 'Eight seconds of stillness before the call. No edits after sealing.')}
          </p>
        </Section>

        <Section title={L('你的数据在哪', 'Where your data lives')}>
          <p className="card-d">
            {L('只在这台设备的浏览器里（localStorage）。没有账号、没有服务器、没有上传、不训练任何模型。', 'In this browser on this device (localStorage). No account, no server, no uploads, no model training.')}
          </p>
          <p className="card-d" style={{ marginTop: 12 }}>
            {L('所以：', 'So: ')}<b style={{ color: 'var(--paper)', fontWeight: 400 }}>{L('换浏览器、清缓存、换电脑，数据就没了。', 'switch browser, clear the cache, or change machines, and it is gone.')}</b>
            {L('请定期在「我」页导出备份——Markdown 给自己读，JSON 给将来导入。', ' Export a backup from the Me page now and then — Markdown to read, JSON to import later.')}
          </p>
          <p className="hint" style={{ marginTop: 12 }}>
            {L('本项目不承担任何数据留存、备份或恢复的责任。数据在你自己手里，这既是它的优点，也是它的风险。', 'This project takes no responsibility for retaining, backing up or recovering your data. It is in your hands — that is both the point and the risk.')}
          </p>
        </Section>

        <Section title={L('版权声明与引用来源', 'Copyright and sources')}>
          <p className="card-d" style={{ marginBottom: 6 }}>
            {L('照明卡里的概念与方法，是对下列公开出版物的', 'The concepts and methods in the cards are ')}<b style={{ color: 'var(--paper)', fontWeight: 400 }}>{L('转述与引用', 'paraphrases and citations')}</b>{L('，', ' of the works below, ')}
            {L('不含任何原文摘录。版权归原作者与出版方所有。', 'with no verbatim excerpts. Copyright remains with the authors and publishers.')}
          </p>
          <p className="hint" style={{ marginBottom: 18 }}>
            {L('卷期页码以出版物信息为准；若下列条目有出入，请以原书原文为准。', 'Volume and page details follow the publications; where an entry differs, the original text governs.')}
          </p>

          <ol style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {REFERENCES.map((r) => (
              <li key={r.id} style={{ paddingLeft: 0 }}>
                <div className="hint" style={{ color: 'var(--lamp)', letterSpacing: '.06em', marginBottom: 4 }}>
                  {lang === 'zh' ? KIND_LABEL[r.kind].zh : KIND_LABEL[r.kind].en}
                </div>
                <p className="card-d" style={{ fontSize: 'var(--fs-label)' }}>{lang === 'zh' ? r.cite : (r.citeEn ?? r.cite)}</p>
                <p className="hint" style={{ marginTop: 4 }}>{L('用于：', 'Used for: ')}{(lang === 'zh' ? r.usedFor : (r.usedForEn ?? r.usedFor)).join(lang === 'zh' ? '、' : ', ')}</p>
                {r.note && <p className="hint" style={{ marginTop: 2, color: 'var(--fog)' }}>{lang === 'zh' ? r.note : (r.noteEn ?? r.note)}</p>}
              </li>
            ))}
          </ol>

          <p className="hint" style={{ marginTop: 28, marginBottom: 10 }}>
            {L('以下条目', 'The entries below have ')}<b style={{ color: 'var(--paper-78)', fontWeight: 400 }}>{L('没有公开文献支撑', 'no published source')}</b>{L('，属于实践观察，', ' and are practice observations, ')}
            {L('在卡片上标为证据等级 C：', 'marked evidence grade C on the cards:')}
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PRACTICE_ONLY.map((p) => (
              <li key={p.name} className="hint">{lang === 'zh' ? <>· {p.name} —— {p.why}</> : <>· {p.nameEn} — {p.whyEn}</>}</li>
            ))}
          </ul>
        </Section>

        <Section title={L('侵权与免责', 'Rights and disclaimer')}>
          <p className="card-d" style={{ fontSize: 'var(--fs-label)' }}>
            {L('1.', '1.')} {L('内容', 'Content')}{L('：本项目对第三方著作只做转述与标注引用，不复制原文。若权利人认为某处引用不当，请提出，我们会在核实后删除或改写。', ': third-party works are paraphrased and cited, never copied. If a rights holder objects to a citation, tell us and we will verify and remove or rewrite it.')}
          </p><p className="card-d" style={{ fontSize: 'var(--fs-label)', marginTop: 20 }}>
            {L('2.', '2.')} {L('名称', 'Name')}{L('：产品名「未决」未做商标注册。若与在先权利冲突，请告知，会改名。', ': the name “Undecided” is not trademarked. If it conflicts with an earlier right, tell us and we will rename it.')}
          </p><p className="card-d" style={{ fontSize: 'var(--fs-label)', marginTop: 20 }}>
            {L('3.', '3.')} {L('非专业建议', 'Not professional advice')}{L('：本项目不提供法律、财税、心理、投资或医疗建议。涉及合伙、股权、合同的决定，请咨询执业律师；涉及情绪与睡眠的问题，请咨询专业人士。', ': no legal, tax, psychological, investment or medical advice. For partnership, equity or contract decisions, consult a practising lawyer; for mood or sleep, consult a professional.')}
          </p><p className="card-d" style={{ fontSize: 'var(--fs-label)', marginTop: 20 }}>
            {L('4.', '4.')} {L('不保证结果', 'No promised outcome')}{L('：本工具不承诺提高你的决策正确率。它只帮你把决定写下来、把该知道的东西递到眼前、在到期后再次打开网站时，让你回看结果。', ': this tool does not promise better decisions. It helps you write the decision down, puts what you should know in front of you, and brings you back to the result when due.')}
          </p><p className="card-d" style={{ fontSize: 'var(--fs-label)', marginTop: 20 }}>
            {L('5.', '5.')} {L('基准率', 'Base rates')}{L('：有来源的会标注来源；没有来源的写明“暂无基准”。绝不编造数字——这是本项目唯一的硬约束。', ': sourced numbers are cited; unsourced ones are marked “no base rate” — no invented figures, that being the project’s one hard rule.')}
          </p><p className="card-d" style={{ fontSize: 'var(--fs-label)', marginTop: 20 }}>
            {L('6.', '6.')} {L('代码许可', 'Licence')}{L('：PolyForm Noncommercial 1.0.0。可以自己用、自己改、非商业分发；不可用于任何商业目的，改过的版本也一样。商业授权需单独书面同意。完整条款见仓库根目录的 LICENSE。', ': PolyForm Noncommercial 1.0.0. Use it, change it, share it non-commercially; no commercial use, including of modified versions. Commercial use requires written permission. Full terms in LICENSE at the repo root.')}
          </p>
        </Section>

        <Foot />
      </div>
    </Shell>
  );
}
