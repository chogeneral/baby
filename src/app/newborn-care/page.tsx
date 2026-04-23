import type { Metadata } from "next";
import Link from "next/link";
import { ContentWriteCta } from "@/components/ContentWriteCta";
import styles from "../contentPage.module.css";

export const metadata: Metadata = {
  title: "신생아 관리",
  description: "만 1세 이하(연도 기준) 신생아 수유, 수면, 목욕 등 기본 돌봄 안내",
};

/** 만 1세 이하 구간을 위한 신생아 케어 안내 페이지(연도만으로 구분) */
export default function NewbornCarePage() {
  return (
    <main className={styles.contentPage}>
      <h1 className={styles.contentTitle}>신생아 관리</h1>
      <p className={styles.contentLead}>
        출생 연도 기준으로 만 1세 이하인 아이를 두신 경우, 함께 적응해 가며 필요한 기본
        돌봄을 정리했어요.
      </p>
      <div className={styles.contentBody}>
        <ul className={styles.contentList}>
          <li>수유: 배고픔 신호를 알아보고, 하루 수유 횟수·양은 소아과 상담과 맞추면 좋아요.</li>
          <li>수면: 하루 총 수면 시간은 아이마다 달라요. 안전한 수면 자세(등 대기 등)를 지켜 주세요.</li>
          <li>목욕: 실온·수온을 맞추고, 목욕 후 보습으로 피부를 보호해 주세요.</li>
          <li>건강: 황달, 체온, 배변 상태를 관찰하고 이상이 있으면 병원에 문의하세요.</li>
        </ul>
      </div>

      <ContentWriteCta />

    </main>
  );
}
