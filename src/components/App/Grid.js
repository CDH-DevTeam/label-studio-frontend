import React, { Component } from "react";
import { Button } from "antd";
import { LeftCircleOutlined, RightCircleOutlined } from "@ant-design/icons";
import Tree from "../../core/Tree";
import styles from "./App.module.scss";
import { EntityTab } from '../AnnotationTabs/AnnotationTabs';
import { observe } from "mobx";
import Konva from "konva";

/***** DON'T TRY THIS AT HOME *****/
/*
Grid renders a container which remains untouched all the process.
On every rerender it renders Item with next annotation in the list.
Rendered annotation is cloned into the container. And index of "current" annotation increases.
This triggers next rerender with next annotation until all the annotations are rendered.
*/

class Item extends Component {
  componentDidMount() {
    Promise.all(this.props.annotation.objects.map(o => {
      return o.isReady || new Promise(resolve => {
        let dispose = observe(o, "isReady", ()=>{
          dispose();
          resolve();
        });
      });
    })).then(()=>{
      // ~2 ticks for canvas to be rendered and resized completely
      setTimeout(this.props.onFinish, 32);
    });
  }

  render() {
    return Tree.renderItem(this.props.root);
  }
}

export default class Grid extends Component {
  state = {
    item: 0,
  };
  container = React.createRef();

  shouldComponentUpdate(nextProps, nexState) {
    return !nextProps.store.selected.selected || nexState.item >= nextProps.annotations.length || nextProps.annotations[nexState.item] === nextProps.store.selected;
  }

  componentDidMount() {
    if (this.props.annotations.length) {
      this.props.store._unselectAll();
      setTimeout(()=>{
        this.props.store._selectItem(this.props.annotations[0]);
      });
    }
  }

  onFinish = () => {
    const c = this.container.current;

    if (!c) return;

    const itemWrapper = c.children[c.children.length - 1];
    const item = itemWrapper.children[itemWrapper.children.length - 1];
    const clone = item.cloneNode(true);

    c.children[this.state.item].appendChild(clone);

    // Force redraw
    Konva.stages.map(stage=>stage.draw());

    /* canvas are cloned empty, so clone their content */
    const sourceCanvas = item.querySelectorAll("canvas");
    const clonedCanvas = clone.querySelectorAll("canvas");

    clonedCanvas.forEach((canvas, i) => {
      canvas.getContext("2d").drawImage(sourceCanvas[i], 0, 0);
    });

    this.setState({ item: this.state.item + 1 }, ()=>{
      if (this.state.item<this.props.annotations.length) {
        this.props.store._selectItem(this.props.annotations[this.state.item]);
      } else {
        this.props.store._unselectAll();
      }
    });

  };

  shift = delta => {
    const c = this.container.current;

    if (!c) return;
    const gap = 30;
    const step = (c.offsetWidth + gap) / 2;
    const current = (c.scrollLeft + delta) / step;
    const next = delta > 0 ? Math.ceil(current) : Math.floor(current);
    const count = this.props.annotations.length;

    if (next < 0 || next > count - 2) return;
    c.scrollTo({ left: next * step, top: 0, behavior: "smooth" });
  };

  left = () => {
    this.shift(-1);
  };

  right = () => {
    this.shift(1);
  };

  select = c => {
    const { store } = this.props;

    c.type === "annotation" ? store.selectAnnotation(c.id) : store.selectPrediction(c.id);
  };

  render() {
    const i = this.state.item;
    const { annotations } = this.props;
    const renderNext = i < annotations.length;

    return (
      <div className={styles.container}>
        <div ref={this.container} className={styles.grid}>
          {annotations.filter(c => !c.hidden).map((c) => (
            <div id={`c-${c.id}`} key={`anno-${c.id}`}>
              <EntityTab
                entity={c}
                onClick={() => this.select(c)}
                prediction={c.type === "prediction"}
                bordered={false}
                style={{ height: 44 }}
              />
            </div>
          ))}
          {renderNext && (
            <div id={`c-tmp`} key={`anno-tmp`}>
              <EntityTab
                entity={this.props.store.selected}
                prediction={this.props.store.selected.type === "prediction"}
                bordered={false}
                style={{ height: 44 }}
              />
              <Item root={this.props.root} onFinish={this.onFinish} key={this.state.item} annotation={this.props.store.selected}/>
            </div>
          )}
        </div>
        <Button type="text" onClick={this.left} className={styles.left} icon={<LeftCircleOutlined />} />
        <Button type="text" onClick={this.right} className={styles.right} icon={<RightCircleOutlined />} />
      </div>
    );
  }
}
