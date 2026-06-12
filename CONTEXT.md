# Espresso Grooming Poker

Espresso Grooming Poker 的核心业务领域术语表。用于统一团队和代码库中的业务语言。

## Language

**Grooming**:
一次团队聚集在一起进行需求估算和讨论的具体活动或会话。作为承载参与者和投票行为的核心容器。
_Avoid_: Room, Session, Game

**Vote**:
在 Grooming 中进行的单个完整估算周期（包括大家出牌和最终开牌）。
_Avoid_: Round, Topic, Story

**Participant**:
加入 Grooming 会议的任何人。默认进行估算，但也可能处于“旁观”状态（Observer），此时不参与该轮的 Vote。
_Avoid_: Member, User, Player

**Point**:
参与者在某次 Vote 中投出的具体估算数值或选项（如 3、5、8）。对应敏捷开发中的 Story Point。
_Avoid_: Card, Score, Estimate

**Deck**:
在一场 Grooming 中，供参与者选择的全部 Point 的集合（例如斐波那契数列）。
_Avoid_: Template, Scale, Options

**Voting / Revealed**:
一轮 Vote 的两个核心状态阶段。"Voting" 代表参与者正在暗中选择 Point；"Revealed" 代表所有分数公开，进入讨论或结果确认阶段。
_Avoid_: Estimating, Discussing, Hidden, Shown

**Consensus**:
在 Revealed 状态下，所有参与投票的人选择了完全相同的 Point。这通常是敏捷估算的终极目标，代表团队对需求工作量的理解达成一致。
_Avoid_: Agreement, Match
