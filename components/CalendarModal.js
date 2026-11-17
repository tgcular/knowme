"use client";
import ZoomModal from "./ZoomModal";
import CalendarBody from "./CalendarBody";

export default function CalendarModal({ rect, onClose, ...rest }) {
  return <ZoomModal rect={rect} onClose={onClose}>{(close) => <CalendarBody {...rest} onClose={close} />}</ZoomModal>;
}
